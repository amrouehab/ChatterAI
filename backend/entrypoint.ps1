Write-Host "Waiting for SQL Server to start..."
Start-Sleep -Seconds 20  # Wait for the database to start

# Run SQL script
Write-Host "Running database migrations..."
Invoke-Expression "& 'C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe' -S database -U sa -P 'Amrou123!' -d master -i 'C:\schema.sql'"

Write-Host "Database initialized!"
