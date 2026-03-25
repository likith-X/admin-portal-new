import os
import subprocess

def sync_env_to_vercel():
    env_file = ".env.local"
    if not os.path.exists(env_file):
        print(f"❌ {env_file} not found")
        return

    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            
            if "=" in line:
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                
                print(f"📡 Adding {key} to Vercel...")
                try:
                    # npx vercel env add [key] [environment] [value]
                    # Using echo to piping the value because Vercel CLI interactive shells are tricky
                    cmd = f"echo {value} | npx vercel env add {key} production"
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    if result.returncode == 0:
                        print(f"✅ {key} added successfully")
                    else:
                        print(f"⚠️ Failed to add {key}: {result.stderr.strip()}")
                except Exception as e:
                    print(f"❌ Error adding {key}: {e}")

if __name__ == "__main__":
    sync_env_to_vercel()
