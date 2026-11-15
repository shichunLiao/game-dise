"""Enable the installed local Blender MCP addon and persist preferences."""
import os
os.environ['DISABLE_TELEMETRY'] = 'true'
import bpy
bpy.ops.preferences.addon_enable(module='blender_mcp')
prefs = bpy.context.preferences.addons['blender_mcp'].preferences
prefs.telemetry_consent = False
prefs.bind_address = '127.0.0.1'
prefs.allow_remote_connections = False
bpy.ops.wm.save_userpref()
if not bpy.app.background:
    bpy.ops.blendermcp.start_server()
print('DISE_BLENDER_CONNECTION_READY', bpy.app.version_string)
