#!/usr/bin/env sh
# Extrae el texto de un .docx a texto plano citable por línea.
#
# Por qué existe: los agentes no leen .docx con fiabilidad, y la regla de método
# del proyecto exige citar el maestro por «apartado y línea del .md». Sin este
# fichero no hay líneas que citar. No hay `pandoc` en las máquinas del equipo, y
# añadirlo como dependencia de sistema obligaría a instalarlo en cada una; esto
# son veinte líneas de shell sobre `unzip`, que sí está.
#
# Qué NO hace: no conserva negritas, tablas ni numeración de estilos. El .docx
# sigue siendo el original editable; el .md es la copia citable, y se regenera
# con cada revisión del maestro.
#
# Uso:
#   scripts/docx2md.sh <entrada.docx> [salida.md]
# Sin salida, escribe a stdout.
#
# Verificado contra Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.docx.

set -eu

if [ $# -lt 1 ]; then
  echo "uso: $0 <entrada.docx> [salida.md]" >&2
  exit 2
fi

entrada="$1"
[ -f "$entrada" ] || { echo "no existe: $entrada" >&2; exit 1; }

extraer() {
  # `</w:p>` cierra cada párrafo de Word: se convierte en salto de línea antes de
  # quitar el marcado, o todo el documento saldría en una sola línea y no habría
  # nada que citar.
  unzip -p "$entrada" word/document.xml \
    | sed 's|</w:p>|\n|g' \
    | sed 's/<[^>]*>//g' \
    | sed 's/&amp;/\&/g;s/&lt;/</g;s/&gt;/>/g;s/&quot;/"/g;s/&apos;/'"'"'/g' \
    | grep -v '^[[:space:]]*$'
}

if [ $# -ge 2 ]; then
  extraer > "$2"
  echo "$2: $(grep -c '' "$2") líneas" >&2
else
  extraer
fi
