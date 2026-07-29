import socket

host = "ep-withered-bread-asfrgqtd.c-4.eu-central-1.aws.neon.tech"
port = 5432

try:
    s = socket.create_connection((host, port), timeout=10)
    print("Connected!")
    s.close()
except Exception as e:
    print(f"Failed: {type(e).__name__}: {e}")