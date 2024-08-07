import os
import openai
import json
import time
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData
from sqlalchemy.orm import sessionmaker


# Initialize the Azure OpenAI client
openai.api_key = os.getenv('AZURE_OPENAI_API_KEY')
openai.api_base = os.getenv('AZURE_OPENAI_ENDPOINT')
openai.api_type = os.getenv('API_TYPE')
openai.api_version = os.getenv('API_VERSION')

# PostgreSQL configuration
POSTGRES_HOST = os.getenv('PGHOST')
POSTGRES_DB = os.getenv('PGDATABASE')
POSTGRES_USER = os.getenv('PGUSER')
POSTGRES_PASSWORD = os.getenv('PGPASSWORD')
POSTGRES_PORT = os.getenv('PGPORT')

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

def analyze_files(file_list, pr_number):
    analysis_results = []
    
    for file_path in file_list:
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
                    analysis=details
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
    
    # Read modified files list from the file created by the GitHub Action
    with open("modified_files.txt", "r") as f:
        file_list = f.read().splitlines()

    print(f"Analyzing files: {file_list}")  # Debug print statement

    analyze_files(file_list, pr_number)

if __name__ == "__main__":
    main()
