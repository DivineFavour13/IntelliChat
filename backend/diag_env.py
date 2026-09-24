from dotenv import load_dotenv
load_dotenv()
import os
print('GROQ_MODEL=', os.environ.get('GROQ_MODEL'))
print('GROQ_API_KEY_SET=', bool(os.environ.get('GROQ_API_KEY')))