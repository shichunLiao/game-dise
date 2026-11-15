"""Send a command to the local Blender MCP addon (Blender must be open)."""
import argparse
import json
import socket
from pathlib import Path

def send(command):
    with socket.create_connection(('127.0.0.1', 9876), timeout=10) as connection:
        connection.settimeout(120)
        connection.sendall(json.dumps(command).encode())
        data = b''
        while True:
            chunk = connection.recv(65536)
            if not chunk:
                raise RuntimeError('Blender closed connection before a complete response')
            data += chunk
            try:
                response = json.loads(data)
                break
            except (ValueError, UnicodeDecodeError):
                continue
    if response.get('status') != 'success':
        raise RuntimeError(response)
    return response

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--script', type=Path)
    args = parser.parse_args()
    command = {'type': 'execute_code', 'params': {'code': args.script.read_text()}} if args.script else {'type': 'get_scene_info', 'params': {}}
    print(json.dumps(send(command), ensure_ascii=False, indent=2))
