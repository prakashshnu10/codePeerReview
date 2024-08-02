import os
import requests
import json
import psycopg2
from psycopg2 import sql
from tabulate import tabulate

def store_analysis_in_db(pr_number, branch_name, merge_status, analysis_text):
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('PGDATABASE'),
            user=os.getenv('PGUSER'),
            password=os.getenv('PGPASSWORD'),
            host=os.getenv('PGHOST'),
            port=os.getenv('PGPORT')
        )
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO analysis_results (pr_number, branch_name, merge_status, analysis_text)
                    VALUES (%s, %s, %s, %s)
                """, (pr_number, branch_name, merge_status, analysis_text))
    except psycopg2.DatabaseError as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

def get_pull_request_number():
    try:
        with open(os.getenv('GITHUB_EVENT_PATH')) as f:
            event_data = json.load(f)
        return event_data['pull_request']['number']
    except (FileNotFoundError, KeyError, json.JSONDecodeError) as e:
        raise Exception(f"Error reading GitHub event data: {e}")

def fetch_pull_request_details(pr_number):
    repo = os.getenv('GITHUB_REPOSITORY')
    token = os.getenv('TOKEN')

    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Error fetching pull request details: {response.status_code}, {response.text}")
    
    return response.json()

def get_merge_status(pr_details):
    return 'merged' if pr_details.get('merged', False) else 'pending'

def post_comment(comment):
    pr_number = get_pull_request_number()
    repo = os.getenv('GITHUB_REPOSITORY')
    token = os.getenv('TOKEN')

    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "body": comment
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code != 201:
        raise Exception(f"Error posting comment: {response.status_code}, {response.text}")

def fetch_analysis_results(pr_number):
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('PGDATABASE'),
            user=os.getenv('PGUSER'),
            password=os.getenv('PGPASSWORD'),
            host=os.getenv('PGHOST'),
            port=os.getenv('PGPORT')
        )
        with conn:
            with conn.cursor() as cursor:
                # Fetch code complexity
                cursor.execute("""
                    SELECT file_path, complexity_level
                    FROM code_complexity
                    WHERE pr_number = %s
                """, (pr_number,))
                complexity_results = cursor.fetchall()

                # Fetch API versioning
                cursor.execute("""
                    SELECT file_path, versioning_followed
                    FROM api_versioning
                    WHERE pr_number = %s
                """, (pr_number,))
                versioning_results = cursor.fetchall()

                # Fetch Swagger documentation
                cursor.execute("""
                    SELECT file_path, swagger_implemented 
                    FROM swagger_documentation
                    WHERE pr_number = %s
                """, (pr_number,))
                swagger_results = cursor.fetchall()

        return complexity_results, versioning_results, swagger_results
    except psycopg2.DatabaseError as e:
        print(f"Database error: {e}")
        return [], [], []
    finally:
        if conn:
            conn.close()

def format_results_as_table(results, headers):
    if not results:
        return "No results found.\n"
    
    table = tabulate(results, headers=headers, tablefmt="grid")
    return table

def main():
    try:
        pr_number = get_pull_request_number()
        branch_name = os.getenv('GITHUB_HEAD_REF')
        pr_details = fetch_pull_request_details(pr_number)
        merge_status = get_merge_status(pr_details)

        complexity_results, versioning_results, swagger_results = fetch_analysis_results(pr_number)

        # Format the analysis text
        complexity_table = format_results_as_table(complexity_results, ["File Path", "Complexity Level", "Details"])
        versioning_table = format_results_as_table(versioning_results, ["File Path", "Versioning Followed", "Analysis"])
        swagger_table = format_results_as_table(swagger_results, ["File Path", "Swagger Implemented", "Details"])

        analysis_text = (
            "Code Complexity Analysis:\n" + complexity_table +
            "\nAPI Versioning Analysis:\n" + versioning_table +
            "\nSwagger Documentation Analysis:\n" + swagger_table
        )

        post_comment(analysis_text)
        store_analysis_in_db(pr_number, branch_name, merge_status, analysis_text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
