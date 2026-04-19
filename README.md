# Local Development

To setup the development server, use two terminals: one for backend server and one for Frontend.

## Backend Setup

Navigate to server directory and execute the following:

```bash
source venv/bin/activate #activate the virtual python environment

pip install -r requirements # install dependencies

uvicorn api.main:app --reload # locally host the db
```

## Frontend Setup

Navigate to client directory and execute:
```bash
npm run dev 
```

Open [http://localhost:5173](http://localhost:5173) (or whatever localhost prompted