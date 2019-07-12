import os
import sys
import json
import requests
import logging
import urllib.parse as urlparse

# logging.basicConfig(level=logging.INFO)
logging.basicConfig(level=logging.INFO, format='%(message)s')

def scraper(filepath):
    with open(filepath) as file:
        urls = file.read().split("\n")
    print("Urls provided = ", urls)

    links_api = "http://localhost:3000/api/"
    comments_url = "http://ytcomments.klostermann.ca/scrape"
    comments_api = "http://ytcomments.klostermann.ca/api"

    def write_comments(comments, index, video_id):
        for obj in comments:
            with open("./data/{}/{}.csv".format(index, video_id), 'a') as file:
                file.write("\"{}\"\n".format(obj['commentText']))
    try:
        for index, main_url in enumerate(urls):
            path = "./data/{}".format(index)
            logging.info("Creating directories")
            if not os.path.exists(path):
                os.makedirs(path)

            r1 = requests.get(links_api, params = {'url' : main_url})

            for obj in r1.json():
                link = obj['link']
                # print(link)
                parsed = urlparse.urlparse(link)
                video_id = urlparse.parse_qs(parsed.query)['v'][0]
                # print(video_id)
                with open("./data/{}/{}.csv".format(index, video_id), 'w') as file:
                    file.write("Comments, Flag\n")

                logging.info("Getting comments of videoId = {}".format(video_id))
                with requests.Session() as s:
                    req1 = s.post(comments_url, data = {'yt-url' : link, 'videoID' : video_id})
                    req2 = s.post(comments_api, data = {'videoID' : video_id})
                    initial_res = json.loads(req2.text)
                    initial_comments = initial_res['comments']
                    write_comments(initial_comments, index, video_id)
                    next_page_token = initial_res['nextPageToken']

                    logging.info("Writing comments of videoId = {}".format(video_id))
                    while(next_page_token != None):
                        req_pag = s.post(comments_api, data = {'videoID' : video_id, 'pageToken': next_page_token})
                        pag_res  = json.loads(req_pag.text)
                        comments_pag = pag_res['comments']
                        write_comments(comments_pag, index, video_id)
                        try:
                            next_page_token = pag_res['nextPageToken']
                        except Exception as e:
                            break
    
    except Exception as e:
        logging.info(e)


if __name__ == "__main__":
    scraper(sys.argv[1])