#!/bin/bash
# Create directories
mkdir -p assets/images assets/icons
# Create index.html
echo "<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>My Website</title>
  <link rel=\"stylesheet\" type=\"text/css\" href=\"styles.css\">
</head>
<body>
  <h1>Hello, World!</h1>
  <script src=\"app.js\"></script>
</body>
</html>" > index.html

# Create styles.css
echo "/* styles.css */
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}

h1 {
  color: #333;
}" > styles.css

# Create app.js
echo "// app.js
console.log('Hello from app.js!');" > app.js

echo "Files created successfully!"
