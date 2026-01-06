# backend/Dockerfile

# 1. Base Image: Use a lightweight Python distribution to keep the final container size small.
# The 'slim' variant reduces the attack surface and deployment time.
FROM python:3.11-slim

# 2. Environment Configuration: Set the primary working directory for all subsequent commands.
WORKDIR /app

# 3. System Dependencies: Install binary libraries required for database drivers (PostgreSQL) 
# and C-compilers needed for certain Python extensions.
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# 4. Dependency Management: Copy only the requirements file first.
# This leverages Docker's layer caching—dependencies are only re-installed 
# if the requirements.txt file changes, making subsequent builds much faster.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Application Code: Copy the entire backend source code into the container image.
COPY . .

# 6. Networking: Inform Docker that the container listens on port 8000.
# While Render or other platforms may map this externally, this instruction 
# serves as vital documentation for the runtime environment.
EXPOSE 8000

# 7. Execution: Start the FastAPI server using Uvicorn.
# We bind to 0.0.0.0 to ensure the service is reachable from outside the container.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]