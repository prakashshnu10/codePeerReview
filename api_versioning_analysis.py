

import os
import openai
import json
import time
import psycopg2
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData
from sqlalchemy.orm import sessionmaker


# Initialize the Azure OpenAI client
openai.api_key = '82d7d9dfc84f443d8b2af93e957624bf'
openai.api_base = 'https://llm-sermo-nu10.openai.azure.com/'
openai.api_type = "azure"
openai.api_version = "2024-02-15-preview"

# PostgreSQL configuration
POSTGRES_HOST = '65.1.55.202'
POSTGRES_DB = 'sonarqube'
POSTGRES_USER = 'sonar'
POSTGRES_PASSWORD = 'sonarqube'
POSTGRES_PORT = '5432'

# Create SQLAlchemy engine and session
DATABASE_URL = f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Define the API versioning table
metadata = MetaData()

versioning_table = Table(
    'api_versioning',
    metadata,
    Column('id', Integer, primary_key=True),
    Column('pr_number', Integer, nullable=False),
    Column('file_path', String, nullable=False),
    Column('versioning_followed', String, nullable=False),
    Column('analysis', String, nullable=False)
)

metadata.create_all(engine)

def get_code_analysis(code):
    try:
        response = openai.ChatCompletion.create(
            engine="nu10",  # Ensure this is the correct engine name
            messages=[
                {"role": "system", "content": "You are a code analysis assistant with expertise in API design and versioning."},
                {"role": "user", "content": f"Analyze the following code:\n\n{code}\n\nDetermine whether API versioning is properly followed in this code. Specifically, check if the API endpoints include version information in their paths or documentation. Provide your response in JSON format with the following fields: 'versioning_followed' (Yes or No), 'details' (a description of findings), and 'code_snippets' (relevant code snippets related to versioning). Example: {{ 'versioning_followed': 'Yes', 'details': 'Versioning is included...', 'code_snippets': '...' }}"}
            ],
            max_tokens=3800
        )
        
        # Log the raw response for debugging
        print(f"Raw response: {response}")
        
        # Wait for the response to be processed
        time.sleep(2)  # Adjust time based on expected response time
        
        if response and response.choices:
            content = response.choices[0].message['content'].strip()
            # Remove any markdown code block indicators
            content = content.replace("```json", "").replace("```", "").strip()
            # Check if content is a valid JSON string
            try:
                json.loads(content)
                return content
            except json.JSONDecodeError:
                return json.dumps({
                    "versioning_followed": "Error",
                    "details": "Invalid JSON response received from LLM.",
                    "code_snippets": "N/A"
                })
        else:
            return json.dumps({
                "versioning_followed": "Unknown",
                "details": "No content returned from the API.",
                "code_snippets": "N/A"
            })
    except Exception as e:
        return json.dumps({
            "versioning_followed": "Error",
            "details": f"An error occurred while analyzing the code: {e}",
            "code_snippets": "N/A"
        })

def analyze_project(directory, pr_number):
    analysis_results = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".ts"):  # Modify this if you need to analyze other file types
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        code = f.read()
                    
                    print(f"Analyzing file: {file_path}")
                    analysis = get_code_analysis(code)
                    
                    # Log the raw response for debugging
                    print(f"Raw response for {file_path}: {analysis}")
                    
                    # Parse JSON response
                    try:
                        analysis_json = json.loads(analysis)
                        versioning_followed = analysis_json.get('versioning_followed', 'Unknown')
                        details = analysis_json.get('details', 'No details provided')
                        
                        # Append the results to the analysis_results list
                        analysis_results.append(f"File: {file_path}\nVersioning Followed: {versioning_followed}\nDetails: {details}\n")

                        # Store the result in PostgreSQL
                        insert_query = versioning_table.insert().values(
                            pr_number=pr_number,
                            file_path=file_path,
                            versioning_followed=versioning_followed,
                            analysis=analysis
                        )
                        session.execute(insert_query)
                        session.commit()
                        
                        # Wait for the insertion to be processed
                        time.sleep(1)  # Adjust time if needed
                        
                    except json.JSONDecodeError as e:
                        analysis_results.append(f"Failed to parse JSON response for {file_path}: {e}\n")
                    
                except Exception as e:
                    analysis_results.append(f"An error occurred while reading {file_path}: {e}\n")

    # Write all analyses to a file
    with open("analysis.txt", "w", encoding="utf-8") as analysis_file:
        analysis_file.write("Project Code Analysis:\n")
        analysis_file.write("\n".join(analysis_results))

def get_pull_request_number():
    # GitHub event data contains the pull request number
    with open(os.getenv('GITHUB_EVENT_PATH')) as f:
        event_data = json.load(f)
    return event_data['pull_request']['number']

def main():
    pr_number = get_pull_request_number()
    project_directory = "src/project/gen-ainest-project/src/app"  # Use os.path.join for cross-platform compatibility

    print(f"Checking directory: {project_directory}")  # Debug print statement
    
    
    if not os.path.isdir(project_directory):
        print(f"Directory {project_directory} does not exist. Please provide the correct directory path.")
        return

    analyze_project(project_directory, pr_number)

if __name__ == "__main__":
    main()
