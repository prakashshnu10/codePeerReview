import os
import requests
import json
import psycopg2


def store_analysis_in_db(pr_number, branch_name, merge_status, analysis_text):
    conn = psycopg2.connect(
        dbname=os.getenv('PGDATABASE'),
        user=os.getenv('PGUSER'),
        password=os.getenv('PGPASSWORD'),
        host=os.getenv('PGHOST'),
        port=os.getenv('PGPORT')
    )
    cursor = conn.cursor()

    # Insert analysis results into PostgreSQL
    cursor.execute("""
        INSERT INTO analysis_results (pr_number, branch_name, merge_status, analysis_text)
        VALUES (%s, %s, %s, %s)
    """, (pr_number, branch_name, merge_status, analysis_text))

    conn.commit()
    cursor.close()
    conn.close()


def get_pull_request_number():
    # GitHub event data contains the pull request number
    with open(os.getenv('GITHUB_EVENT_PATH')) as f:
        event_data = json.load(f)
    return event_data['pull_request']['number']


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
    print(comment)
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


def main():
    pr_number = get_pull_request_number()
    branch_name = os.getenv('GITHUB_HEAD_REF')
    pr_details = fetch_pull_request_details(pr_number)
    merge_status = get_merge_status(pr_details)

    with open("analysis.txt", "r") as file:
        analysis = file.read()

    post_comment(analysis)
    store_analysis_in_db(pr_number, branch_name, merge_status, analysis)


if __name__ == "__main__":
    main()
