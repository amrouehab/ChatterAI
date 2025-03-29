# Use a Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements file and install dependencies 
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application into the container
COPY app.py .
COPY schema.sql .

# Expose the port the app runs on (note: your app uses port 3000)
EXPOSE 3000

# Run the application
CMD ["python", "app.py"]