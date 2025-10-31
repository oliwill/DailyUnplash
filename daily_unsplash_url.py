import requests
from datetime import datetime
import sys
import schedule
import time

def get_daily_image_url():
    url = "https://api.unsplash.com/photos/random"
    params = {
        "orientation": "landscape",
        # # "w": 1600,
        "h": 900,
        "fit": "crop"
    }
    headers = {
        "Authorization": "Client-ID zQdQLVxQ3LRM3rPl9QSfGZ14Gb9XHAAWLoEoyOgxwP4"  # 请确保替换为你的实际API密钥
    }

    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        image_url = data['urls']['raw']
        
        image_url += f"&w=1600&h=900&fit=crop"
        
        return image_url
    
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        if response.status_code == 401:
            print("This could be due to an invalid API key.", file=sys.stderr)
        elif response.status_code == 403:
            print("This could be due to lack of permissions or exceeded API limits.", file=sys.stderr)
        return None

def job():
    url = get_daily_image_url()
    if url:
        with open(r"C:\Users\Lzw\Dropbox\Logseq\unsplash_urls.log", "a") as f:
            f.write(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}: {url}\n")
        print(f"URL saved: {url}")
    else:
        print("Failed to get URL")

# 设置每天 9:30 运行任务
schedule.every().day.at("09:30").do(job)

if __name__ == "__main__":
    print("Scheduler started. Waiting for 9:30 AM to run the task...")
    while True:
        schedule.run_pending()
        time.sleep(1)