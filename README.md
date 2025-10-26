# 🧾 PDFtoJSON — OCR bancario con Tesseract.js

Convierte **estados de cuenta bancarios en formato PDF** a **JSON estructurado** mediante reconocimiento óptico de caracteres (OCR) usando [Tesseract.js](https://github.com/naptha/tesseract.js).

Este proyecto forma parte del sistema de **Conciliación Bancaria Automatizada**, diseñado para procesar estados de cuenta de bancos costarricenses como **Grupo Mutual**, extrayendo los movimientos, fechas, descripciones y montos de manera confiable.

---

## 🚀 Características principales

- 🧠 OCR local con **Tesseract.js** (sin dependencias en la nube)
- 📄 Conversión de **PDF → imágenes → texto → JSON**
- 🔍 Limpieza y normalización de datos (fechas, montos, balances)
- 🧾 Parser especializado para **Grupo Mutual**
- 📂 Procesamiento por lotes desde carpeta `/input`
- 🧰 Estructura modular para agregar nuevos bancos fácilmente
- ⚙️ Compatible con **Node.js 20+ / TypeScript**

---

## 📦 Estructura del proyecto

PdftoJson/
├── input/ # PDFs de entrada
├── output/ # Resultados JSON generados
├── src/
│ ├── index.ts # CLI principal
│ ├── ocr/ # Módulo OCR (Tesseract + PDF a imagen)
│ │ ├── index.ts
│ │ ├── pdfToImages.ts
│ │ └── ocrPage.ts
│ ├── parsers/ # Parsers específicos por banco
│ │ └── parseMutualAccount.ts
│ ├── utils/ # Utilidades generales
│ │ ├── dates.ts
│ │ ├── files.ts
│ │ ├── logger.ts
│ │ └── money.ts
│ └── domain/ # Tipos y esquemas
│ └── types.ts
├── .env.example # Variables de entorno
├── .gitignore
├── package.json
└── tsconfig.json

yaml
Copiar código

---

## ⚙️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/gato1981cr/PdftoJson.git
cd PdftoJson
2. Instalar dependencias
bash
Copiar código
npm install
3. Configurar entorno
Copia el archivo .env.example a .env y ajusta los valores si es necesario (por ahora no se requiere S3).

bash
Copiar código
cp .env.example .env
▶️ Uso
1. Colocar tus PDFs
Guarda los archivos .pdf en la carpeta input/.

2. Ejecutar el OCR
bash
Copiar código
npm run dev
El programa:

Procesará cada PDF dentro de input/

Convertirá sus páginas a imágenes

Usará Tesseract.js para extraer texto

Parseará los movimientos bancarios

Guardará un JSON en output/ con el resultado

3. Resultado esperado
Ejemplo de salida:

json
Copiar código
{
  "movimientos": [
    {
      "date": "01/10/2025",
      "description": "TRANSFERENCIA SINPE",
      "debit": 15000.0,
      "credit": null,
      "balance": 230500.0
    },
    {
      "date": "02/10/2025",
      "description": "DEPÓSITO CAJERO",
      "debit": null,
      "credit": 50000.0,
      "balance": 280500.0
    }
  ]
}
🧩 Dependencias principales
Paquete	Uso
tesseract.js	Motor OCR local basado en WebAssembly
pdf2pic	Conversión de páginas PDF a imágenes PNG
sharp	Preprocesamiento de imágenes (escala de grises, contraste)
fs-extra	Manejo avanzado de archivos y directorios
tsx	Ejecución directa de TypeScript sin build previo

🧠 Cómo funciona
Conversión PDF → Imágenes

Cada página del PDF se convierte a imagen (pdf2pic o pdf-lib).

Preprocesamiento

Se binariza y mejora el contraste con sharp.

OCR con Tesseract

Se reconocen los textos en español e inglés (spa+eng).

Parser de Grupo Mutual

Se aplican expresiones regulares robustas para detectar fecha, descripción y montos.

Normalización y exportación

Se limpian los números y fechas, y se genera un JSON final.

🧪 Ejecución de pruebas (futuro)
bash
Copiar código
npm test
(a implementar con Vitest o Jest)

🧹 Limpieza de temporales
bash
Copiar código
npm run clean
Elimina output/ y cualquier imagen temporal generada por OCR.

🗺️ Roadmap
 Agregar parser para BAC Credomatic y Banco Nacional

 Integración con backend de conciliación bancaria

 Soporte para subida de PDFs vía API REST

 Validación con esquema Zod

 Dashboard web (frontend React/Next.js)

🧑‍💻 Autor
Johan González Moreira
Desarrollador Full Stack — Costa Rica 🇨🇷
GitHub @gato1981cr

📜 Licencia
Este proyecto se distribuye bajo la licencia MIT.
Puedes usarlo, modificarlo y adaptarlo libremente con atribución.
