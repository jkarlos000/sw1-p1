// Script de prueba para analizar estructura de diagrama JointJS
// Ejecutar en consola del navegador cuando tengas el diagrama abierto

console.log('=== ANÁLISIS DE ESTRUCTURA DEL DIAGRAMA ===');

// Obtener todas las celdas
const cells = window.rappidService?.graph?.getCells() || [];

console.log(`\nTotal de elementos: ${cells.length}\n`);

cells.forEach((cell, idx) => {
    console.log(`\n--- Elemento ${idx + 1} ---`);
    console.log('Tipo:', cell.get('type'));
    console.log('ID:', cell.id);
    
    const attrs = cell.get('attrs');
    if (attrs) {
        console.log('Atributos disponibles:', Object.keys(attrs));
        
        // Buscar texto en diferentes ubicaciones
        Object.keys(attrs).forEach(key => {
            if (attrs[key]?.text) {
                console.log(`  ${key}.text:`, attrs[key].text);
            }
        });
    }
    
    // Propiedades adicionales
    console.log('name:', cell.get('name'));
    console.log('attributes:', cell.get('attributes'));
    console.log('methods:', cell.get('methods'));
});

console.log('\n=== JSON completo de ejemplo ===');
if (cells.length > 0) {
    console.log(JSON.stringify(cells[0].toJSON(), null, 2));
}
