#!/bin/bash

# Script simplificado para desplegar a Firebase Hosting

echo "=== Iniciando despliegue simplificado de Gengar Market ==="

# Crear firebase.json simplificado
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.md",
      "**/*.sh",
      "private/**"
    ],
    "rewrites": [
      {
        "source": "/",
        "destination": "/productos.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOF

echo "Configuración simplificada de Firebase creada."

# Modificar el archivo login-register.js
if [ -f "js/login-register.js" ]; then
    # Hacer copia de seguridad
    cp js/login-register.js js/login-register.js.bak
    
    # Reemplazar las redirecciones (sin usar expresiones regulares complejas)
    sed -i 's|window.location.href = "index.html"|window.location.href = "/"|g' js/login-register.js
    
    echo "Archivo login-register.js modificado."
else
    echo "Error: No se encontró el archivo js/login-register.js"
    exit 1
fi

# Desplegar a Firebase
echo "Desplegando a Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "=== ¡Despliegue completado con éxito! ==="
    echo "La página principal ahora está configurada para ser productos.html"
    echo "Las redirecciones después del login ahora apuntan a la raíz del sitio"
else
    echo "=== Error durante el despliegue ==="
    echo "Por favor, revisa los errores anteriores y vuelve a intentarlo."
fi