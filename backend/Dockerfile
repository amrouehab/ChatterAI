# Use a lightweight Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application into the container
COPY . .

# Copy the PowerShell database migration script
COPY entrypoint.ps1 /app/entrypoint.ps1
COPY schema.sql /app/schema.sql

# Expose the port the app runs on
EXPOSE 5000

# Run the entrypoint script before starting the app
CMD ["pwsh", "-File", "/app/entrypoint.ps1"] && ["python", "app.py"]
