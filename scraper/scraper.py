import os
import dotenv
import requests
import json
from bs4 import BeautifulSoup
from tqdm import tqdm

dotenv.load_dotenv()

os.makedirs("out/fixtures/profiles", exist_ok=True)
os.makedirs("out/fixtures/solves", exist_ok=True)
os.makedirs("out/fixtures/graphs", exist_ok=True)

rctf = os.environ["RCTF_URL"].removesuffix("/")
api = f"{rctf}/api/v1"
token = os.environ["RCTF_TOKEN"]

s = requests.Session()
s.headers.update({"Authorization": f"Bearer {token}"})

print("Dumping homepage...")
r = s.get(rctf)
r.raise_for_status()
head = BeautifulSoup(r.text, "lxml").find("head")
head.find("link", {"rel": "stylesheet"}).decompose()
with open("./out/index.html", "w") as f:
    f.write(f"<!DOCTYPE html><html>{head}<body><% preact.bodyEnd %></body></html>")

print("Dumping challenges...")
r = s.get(f"{api}/challs")
r.raise_for_status()

j = r.json()
if j["kind"] != "goodChallenges":
    raise Exception("Failed to dump challenges: " + j["message"])

challs = j["data"]
with open("./out/fixtures/challs.json", "w") as f:
    f.write(r.text)

def dump_paginated(endpoint, kind, field, total=None):
    offset = 0
    limit = 100
    first_resp = None
    if "?" in endpoint:
        endpoint += "&"
    else:
        endpoint += "?"
    data = []
    while True:
        r = s.get(f"{endpoint}offset={offset}&limit={limit}")
        r.raise_for_status()
        j = r.json()
        if j["kind"] != kind:
            raise Exception("Failed to dump paginated data: " + j["message"])
        if first_resp is None:
            first_resp = j
        data += j["data"][field]
        if total is None:
            total = j["data"]["total"]
        if offset >= total:
            break
        offset += limit
    first_resp["data"][field] = data
    return first_resp

print("Dumping solves...")
for chall in tqdm(challs, miniters=1):
    cid = chall["id"]
    filename = f"./out/fixtures/solves/{cid}.json"
    try:
        with open(filename, "r") as f:
            solve_resp = json.load(f)
    except FileNotFoundError:
        solve_resp = dump_paginated(f"{api}/challs/{cid}/solves", "goodChallengeSolves", "solves", chall["solves"])
        with open(filename, "w") as f:
            json.dump(solve_resp, f, separators=(",", ":"))

print("Dumping profiles...")
leaderboard_resp = dump_paginated(f"{api}/leaderboard/now", "goodLeaderboard", "leaderboard")
divisions = set()
for x in tqdm(leaderboard_resp["data"]["leaderboard"], miniters=1):
    uuid = x["id"]
    filename = f"./out/fixtures/profiles/{uuid}.json"
    try:
        with open(filename, "r") as f:
            j = json.load(f)
    except FileNotFoundError:
        r = s.get(f"{api}/users/{uuid}")
        r.raise_for_status()
        j = r.json()
        if j["kind"] != "goodUserData":
            raise Exception(f"Failed to dump profile {uuid}: " + j["message"])
        with open(filename, "w") as f:
            f.write(r.text)
    divisions.add(j["data"]["division"])
    x["division"] = j["data"]["division"]

print("Dumping leaderboard...")
with open("./out/fixtures/leaderboard.json", "w") as f:
    json.dump(leaderboard_resp, f, separators=(",", ":"))

print("Dumping graphs...")
divisions.add(None)
for div in divisions:
    r = s.get(f"{api}/leaderboard/graph?limit=10" + ("" if div is None else f"&division={div}"))
    r.raise_for_status()
    j = r.json()
    if j["kind"] != "goodLeaderboard":
        raise Exception(f"Failed to dump leaderboard graph: " + j["message"])
    with open(f"./out/fixtures/graphs/graph{'' if div is None else '-' + div}.json", "w") as f:
        f.write(r.text)
