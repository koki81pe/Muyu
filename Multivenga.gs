// MOD-001: ENCABEZADO [INICIO]
/*
*****************************************
PROYECTO: Muyu Ventas
ARCHIVO: Multiventa.gs
VERSIÓN: 01.01
FECHA: 30/01/2026 19:34 (UTC-5)
*****************************************
*/
// MOD-001: FIN

// MOD-002: ALIAS MEDIOS PAGO [INICIO]
function getMediosPago() {
  return getModosPago();
}
// MOD-002: FIN

// MOD-003: BOTONES CATEGORÍA [INICIO]
function getCategoriasBoton() {
  const ss = obtenerSpreadsheet();
  const sheetBcat = ss.getSheetByName('Bcat');
  const sheetCat = ss.getSheetByName(HOJA_CATEGORIAS);
  
  if (!sheetBcat) {
    Logger.log('Hoja Bcat no encontrada');
    return [];
  }
  
  if (!sheetCat) {
    Logger.log('Hoja Cat no encontrada');
    return [];
  }
  
  const categoriasValidas = sheetCat.getRange('A2:A').getValues()
    .map(row => row[0])
    .filter(cat => cat !== '');
  
  const datosBcat = sheetBcat.getRange('A2:B').getValues();
  
  const botonesCategoria = [];
  
  datosBcat.forEach(row => {
    const categoria = row[0];
    const boton = row[1];
    
    if (categoria && categoria.toString().trim() !== '' && 
        boton && boton.toString().trim() !== '' &&
        categoriasValidas.includes(categoria)) {
      botonesCategoria.push({
        categoria: categoria,
        boton: boton
      });
    }
  });
  
  return botonesCategoria;
}
// MOD-003: FIN

// MOD-004: REGISTRAR MÚLTIPLES [INICIO]
function registrarVentasMultiples(ventas) {
  if (!ventas || !Array.isArray(ventas) || ventas.length === 0) {
    throw new Error("No se recibieron datos de ventas válidos");
  }
  
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_VENTAS);
  const fechaPeru = obtenerFechaPeru();
  
  // Validación de campos incompletos
  const filasProblematicas = [];
  ventas.forEach((venta, index) => {
    const tieneProducto = venta.producto && venta.producto.trim() !== '';
    const tienePrecio = venta.precioUnitario && parseFloat(venta.precioUnitario) > 0;
    const tieneMedioPago = venta.medioPago && venta.medioPago.trim() !== '';
    const tieneCantidad = venta.cantidad && parseFloat(venta.cantidad) > 0;
    
    if ((tieneProducto || tienePrecio) && 
        (!tieneProducto || !tieneMedioPago || !tienePrecio || !tieneCantidad)) {
      filasProblematicas.push({ fila: index + 1, producto: tieneProducto, medioPago: tieneMedioPago, precio: tienePrecio, cantidad: tieneCantidad });
    }
  });
  
  if (filasProblematicas.length > 0) {
    let mensajeError = "⚠️ Hay campos incompletos en las siguientes filas:\n\n";
    filasProblematicas.forEach(problema => {
      const camposFaltantes = [];
      if (!problema.producto) camposFaltantes.push("Producto");
      if (!problema.medioPago) camposFaltantes.push("Medio de Pago");
      if (!problema.precio) camposFaltantes.push("Precio");
      if (!problema.cantidad) camposFaltantes.push("Cantidad");
      mensajeError += `Fila ${problema.fila}: Falta(n) ${camposFaltantes.join(', ')}\n`;
    });
    mensajeError += "\nPor favor completa todos los campos obligatorios o deja la fila completamente vacía.";
    throw new Error(mensajeError);
  }
  
  const ventasValidas = ventas.filter(venta =>
    venta.producto && venta.producto.trim() !== '' &&
    venta.medioPago && venta.medioPago.trim() !== '' &&
    venta.precioUnitario && parseFloat(venta.precioUnitario) > 0 &&
    venta.cantidad && parseFloat(venta.cantidad) > 0
  );
  
  if (ventasValidas.length === 0) {
    throw new Error("No hay ventas válidas para registrar");
  }
  
  const newRow = encontrarUltimaFila(sheet);
  const cantidadYapes = ventasValidas.filter(v => v.medioPago.toUpperCase() === 'YAPE').length;
  const aplicarFormatoYape = cantidadYapes > 1;
  let ultimaFilaYape = -1;
  
  ventasValidas.forEach((venta, index) => {
    const currentRow = newRow + index;
    
    sheet.getRange(currentRow, 1).setValue(fechaPeru);
    sheet.getRange(currentRow, 2).setValue(venta.categoria || '');
    sheet.getRange(currentRow, 3).setValue(venta.producto);
    sheet.getRange(currentRow, 4).setValue(venta.medioPago);
    sheet.getRange(currentRow, 5).setValue(parseFloat(venta.precioUnitario) || 0);
    sheet.getRange(currentRow, 6).setValue(parseFloat(venta.cantidad) || 0);
    sheet.getRange(currentRow, 7).setFormula(`=E${currentRow}*F${currentRow}`);
    
    // Acumulado columna H:
    if (currentRow === 2) {
    sheet.getRange(currentRow, 8).setFormula(`=G${currentRow}`);
    } else {
    sheet.getRange(currentRow, 8).setFormula(`=H${currentRow - 1}+G${currentRow}`);
    }


    if (aplicarFormatoYape && venta.medioPago.toUpperCase() === 'YAPE') {
      sheet.getRange(currentRow, 3).setBackground('#FFFF66');
      ultimaFilaYape = currentRow;
    }
  });
  
  if (aplicarFormatoYape && ultimaFilaYape > 0) {
    sheet.getRange(ultimaFilaYape, 3).setBorder(
      null, null, true, null,
      null, null, 
      '#000000',
      SpreadsheetApp.BorderStyle.SOLID_MEDIUM
    );
  }
  
  return `${ventasValidas.length} venta(s) registrada(s) correctamente`;
}
// MOD-004: FIN

// MOD-005: BATERÍA PRUEBAS [INICIO]
function EJECUTAR_TODAS_LAS_PRUEBAS_MULTIVENTA() {
  Logger.clear();
  Logger.log('🧪 ============================================');
  Logger.log('🧪 INICIANDO BATERÍA DE PRUEBAS - MULTIVENTA');
  Logger.log('🧪 ============================================\n');
  
  const resultados = { total: 0, exitosas: 0, fallidas: 0, detalles: [] };
  
  // Configuración
  ejecutarPrueba('TEST 1: Spreadsheet ID', test_spreadsheetId, resultados);
  ejecutarPrueba('TEST 2: Hoja Ventas', test_hojaVentas, resultados);
  ejecutarPrueba('TEST 3: Hoja Cat', test_hojaCat, resultados);
  ejecutarPrueba('TEST 4: Hoja Mpago', test_hojaMpago, resultados);
  ejecutarPrueba('TEST 5: Hoja Bcat', test_hojaBcat, resultados);
  
  // Funciones GET
  ejecutarPrueba('TEST 6: getCategorias()', test_getCategorias, resultados);
  ejecutarPrueba('TEST 7: getModosPago()', test_getModosPago, resultados);
  ejecutarPrueba('TEST 8: getMediosPago()', test_getMediosPago, resultados);
  ejecutarPrueba('TEST 9: getCategoriasBoton()', test_getCategoriasBoton, resultados);
  
  // Auxiliares
  ejecutarPrueba('TEST 10: obtenerFechaPeru()', test_obtenerFechaPeru, resultados);
  ejecutarPrueba('TEST 11: encontrarUltimaFila()', test_encontrarUltimaFila, resultados);
  
  // Validación
  ejecutarPrueba('TEST 12: Array vacío', test_arrayVacio, resultados);
  ejecutarPrueba('TEST 13: Datos null', test_datosNull, resultados);
  ejecutarPrueba('TEST 14: No array', test_datosNoArray, resultados);
  ejecutarPrueba('TEST 15: Fila incompleta Producto', test_filaIncompletaProducto, resultados);
  ejecutarPrueba('TEST 16: Fila incompleta Precio', test_filaIncompletaPrecio, resultados);
  ejecutarPrueba('TEST 17: Fila vacía', test_filaVacia, resultados);
  
  // Registrar
  ejecutarPrueba('TEST 18: Venta simple', test_ventaValidaSimple, resultados);
  ejecutarPrueba('TEST 19: Múltiples ventas', test_ventasValidasMultiples, resultados);
  ejecutarPrueba('TEST 20: Múltiples Yapes', test_multiplesYapes, resultados);
  
  // Resumen
  Logger.log('\n🧪 ============================================');
  Logger.log(`✅ Total: ${resultados.total} | Exitosas: ${resultados.exitosas} | Fallidas: ${resultados.fallidas}`);
  Logger.log(`📊 Éxito: ${((resultados.exitosas/resultados.total)*100).toFixed(2)}%`);
  Logger.log('🧪 ============================================');
  
  return resultados;
}
// MOD-005: FIN

// MOD-006: FUNCIONES PRUEBA [INICIO]
function ejecutarPrueba(nombre, funcionPrueba, resultados) {
  resultados.total++;
  try {
    funcionPrueba();
    resultados.exitosas++;
    resultados.detalles.push({ nombre, estado: 'EXITOSA', mensaje: 'OK' });
    Logger.log(`✅ ${nombre}: EXITOSA`);
  } catch (error) {
    resultados.fallidas++;
    resultados.detalles.push({ nombre, estado: 'FALLIDA', mensaje: error.message });
    Logger.log(`❌ ${nombre}: ${error.message}`);
  }
}

function test_spreadsheetId() {
  if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID no definido');
  SpreadsheetApp.openById(SPREADSHEET_ID);
}

function test_hojaVentas() {
  const sheet = obtenerSpreadsheet().getSheetByName(HOJA_VENTAS);
  if (!sheet) throw new Error(`Hoja "${HOJA_VENTAS}" no encontrada`);
}

function test_hojaCat() {
  const sheet = obtenerSpreadsheet().getSheetByName(HOJA_CATEGORIAS);
  if (!sheet) throw new Error(`Hoja "${HOJA_CATEGORIAS}" no encontrada`);
}

function test_hojaMpago() {
  const sheet = obtenerSpreadsheet().getSheetByName(HOJA_MEDIOS_PAGO);
  if (!sheet) throw new Error(`Hoja "${HOJA_MEDIOS_PAGO}" no encontrada`);
}

function test_hojaBcat() {
  const sheet = obtenerSpreadsheet().getSheetByName('Bcat');
  if (!sheet) throw new Error('Hoja "Bcat" no encontrada');
}

function test_getCategorias() {
  const categorias = getCategorias();
  if (!Array.isArray(categorias) || categorias.length === 0) {
    throw new Error('getCategorias() inválido');
  }
  Logger.log(`   → ${categorias.length} categorías`);
}

function test_getModosPago() {
  const modos = getModosPago();
  if (!Array.isArray(modos) || modos.length === 0) {
    throw new Error('getModosPago() inválido');
  }
  Logger.log(`   → ${modos.length} modos pago`);
}

function test_getMediosPago() {
  const medios = getMediosPago();
  if (!Array.isArray(medios) || medios.length === 0) {
    throw new Error('getMediosPago() inválido');
  }
  Logger.log(`   → ${medios.length} medios pago`);
}

function test_getCategoriasBoton() {
  const botones = getCategoriasBoton();
  if (!Array.isArray(botones)) throw new Error('getCategoriasBoton() no array');
  if (botones.length > 0) {
    const btn = botones[0];
    if (!btn.categoria || !btn.boton) throw new Error('Estructura botón inválida');
  }
  Logger.log(`   → ${botones.length} botones categoría`);
}

function test_obtenerFechaPeru() {
  const fecha = obtenerFechaPeru();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
    throw new Error(`Fecha inválida: ${fecha}`);
  }
  Logger.log(`   → ${fecha}`);
}

function test_encontrarUltimaFila() {
  const fila = encontrarUltimaFila(obtenerSpreadsheet().getSheetByName(HOJA_VENTAS));
  if (typeof fila !== 'number' || fila < 1) throw new Error(`Fila inválida: ${fila}`);
  Logger.log(`   → Fila: ${fila}`);
}

function test_arrayVacio() {
  try { registrarVentasMultiples([]); throw new Error('No lanzó error'); }
  catch (e) { if (!e.message.includes('vacío')) throw e; }
}

function test_datosNull() {
  try { registrarVentasMultiples(null); throw new Error('No lanzó error'); }
  catch (e) { if (!e.message.includes('datos')) throw e; }
}

function test_datosNoArray() {
  try { registrarVentasMultiples("texto"); throw new Error('No lanzó error'); }
  catch (e) { if (!e.message.includes('array')) throw e; }
}

function test_filaIncompletaProducto() {
  try {
    registrarVentasMultiples([{
      categoria: 'Test', producto: 'Volante', medioPago: '', precioUnitario: '', cantidad: ''
    }]);
    throw new Error('No lanzó error');
  } catch (e) { if (!e.message.includes('incompletos')) throw e; }
}

function test_filaIncompletaPrecio() {
  try {
    registrarVentasMultiples([{
      categoria: '', producto: '', medioPago: '', precioUnitario: '10.50', cantidad: ''
    }]);
    throw new Error('No lanzó error');
  } catch (e) { if (!e.message.includes('incompletos')) throw e; }
}

function test_filaVacia() {
  try {
    registrarVentasMultiples([{
      categoria: '', producto: '', medioPago: 'Yape', precioUnitario: '', cantidad: '1'
    }]);
    throw new Error('No lanzó error');
  } catch (e) { if (!e.message.includes('válidas')) throw e; }
}

function test_ventaValidaSimple() {
  const resultado = registrarVentasMultiples([{
    categoria: 'TEST', producto: 'Test Simple', medioPago: 'Efectivo',
    precioUnitario: '10.00', cantidad: '1'
  }]);
  if (!resultado.includes('1 venta')) throw new Error(`Resultado: ${resultado}`);
  Logger.log(`   → ${resultado}`);
}

function test_ventasValidasMultiples() {
  const resultado = registrarVentasMultiples([
    { categoria: 'TEST', producto: 'Test 1', medioPago: 'Efectivo', precioUnitario: '10.00', cantidad: '2' },
    { categoria: 'TEST', producto: 'Test 2', medioPago: 'Yape', precioUnitario: '15.50', cantidad: '1' },
    { categoria: '', producto: '', medioPago: '', precioUnitario: '', cantidad: '1' }
  ]);
  if (!resultado.includes('2 venta')) throw new Error(`Resultado: ${resultado}`);
  Logger.log(`   → ${resultado}`);
}

function test_multiplesYapes() {
  const resultado = registrarVentasMultiples([
    { categoria: 'TEST', producto: 'Yape 1', medioPago: 'Yape', precioUnitario: '10.00', cantidad: '1' },
    { categoria: 'TEST', producto: 'Yape 2', medioPago: 'Yape', precioUnitario: '20.00', cantidad: '1' },
    { categoria: 'TEST', producto: 'Yape 3', medioPago: 'Yape', precioUnitario: '30.00', cantidad: '1' }
  ]);
  if (!resultado.includes('3 venta')) throw new Error(`Resultado: ${resultado}`);
  Logger.log(`   → ${resultado} (formato aplicado)`);
}
// MOD-006: FIN

// MOD-007: CÓDIGO DE CIERRE [INICIO]
Logger.log('✅ Muyu Ventas Multiventa.gs v01.00 cargado correctamente');
// MOD-007: FIN

// MOD-099: NOTAS [INICIO]
/*
DESCRIPCIÓN:
Módulo Multiventa.gs para registro múltiple con validación robusta v1.00.

DEPENDENCIAS EXTERNAS:
- Master.gs: obtenerSpreadsheet(), encontrarUltimaFila(), obtenerFechaPeru()
- Univenta.gs: getModosPago()
- Spreadsheet: Hojas 'Ventas', 'Cat', 'Mpago', 'Bcat'

CARACTERÍSTICAS CLAVE:
- MOD-003: Valida Bcat contra Cat (doble validación)
- MOD-004: Validación estricta "todo o nada" por fila
- MOD-004: Formato especial múltiples Yapes (amarillo + línea negra)
- MOD-005/006: 20 pruebas automatizadas completas

ADVERTENCIAS:
- Pruebas TEST 18-20 escriben datos reales (usar con cuidado)
- Hoja Bcat requerida (A=categoría, B=botón)
- Validación bloquea registros parciales

COMPATIBILIDAD:
✔ 100% alineado con CodeWorkShop v5.0
✔ 100% retrocompatible con Univenta.gs
*/
// MOD-099: FIN
