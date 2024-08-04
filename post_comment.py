import os
import requests
import json
import psycopg2
from tabulate import tabulate


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
                    SELECT EXISTS (
                        SELECT 1
                        FROM code_complexity
                        WHERE pr_number = %s
                    )
                """, (pr_number,))
                code_complexity_done = cursor.fetchone()[0]

                # Fetch API versioning
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1
                        FROM api_versioning
                        WHERE pr_number = %s
                    )
                """, (pr_number,))
                api_versioning_done = cursor.fetchone()[0]

                # Fetch Swagger documentation
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1
                        FROM swagger_documentation
                        WHERE pr_number = %s
                    )
                """, (pr_number,))
                swagger_done = cursor.fetchone()[0]

        return code_complexity_done, api_versioning_done, swagger_done
    except psycopg2.DatabaseError as e:
        print(f"Database error: {e}")
        return False, False, False
    finally:
        if conn:
            conn.close()

def main():
    try:
        pr_number = get_pull_request_number()
        branch_name = os.getenv('GITHUB_HEAD_REF')
        pr_details = fetch_pull_request_details(pr_number)

        code_complexity_done, api_versioning_done, swagger_done = fetch_analysis_results(pr_number)

        # Format the analysis text
        analysis_text = (
            f"API Versioning Analysis: {'Done' if api_versioning_done else 'Not Done'}\n"
            f"Swagger Analysis: {'Done' if swagger_done else 'Not Done'}\n"
            f"Code Complexity Analysis: {'Done' if code_complexity_done else 'Not Done'}\n\n"
            f"Full Code Analysis: [Link](http://65.1.55.202:9000/dashboard?id=pr_automate)\n"
            f"Gen AI Report: [Link](http://localhost:8501/?pr_number={pr_number})"
        )

        post_comment(analysis_text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
