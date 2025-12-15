//// ============================================
//// MULTIVENTA.GS - MÓDULO DE VENTA MÚLTIPLE
//// ============================================

//// CARGAR MEDIOS DE PAGO (alias para compatibilidad)
function getMediosPago() {
  return getModosPago();
}

//// CARGAR BOTONES DE CATEGORÍA DESDE HOJA Bcat
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
  
  // Obtener categorías válidas de la hoja Cat
  const categoriasValidas = sheetCat.getRange('A2:A').getValues()
    .map(row => row[0])
    .filter(cat => cat !== '');
  
  // Obtener datos de Bcat (desde fila 2)
  const datosBcat = sheetBcat.getRange('A2:B').getValues();
  
  const botonesCategoria = [];
  
  datosBcat.forEach(row => {
    const categoria = row[0];
    const boton = row[1];
    
    // Solo agregar si ambos campos tienen valor y la categoría existe en Cat
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

//// REGISTRAR VENTAS MÚLTIPLES
function registrarVentasMultiples(ventas) {
  // =====================================================
  // VALIDACIÓN INICIAL DE DATOS
  // =====================================================
  if (!ventas) {
    throw new Error("No se recibieron datos de ventas");
  }
  
  if (!Array.isArray(ventas)) {
    throw new Error("Los datos recibidos no son un array válido");
  }
  
  if (ventas.length === 0) {
    throw new Error("El array de ventas está vacío");
  }
  
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_VENTAS);
  
  // Fecha Perú
  const fechaPeru = obtenerFechaPeru();
  
  // =====================================================
  // VALIDACIÓN DE CAMPOS ALERTA - NUEVA LÓGICA
  // =====================================================
  // Detectar filas con "campos alerta" (Producto o Precio) pero incompletas
  const filasProblematicas = [];
  
  ventas.forEach((venta, index) => {
    const tieneProducto = venta.producto && venta.producto.trim() !== '';
    const tienePrecio = venta.precioUnitario && parseFloat(venta.precioUnitario) > 0;
    const tieneMedioPago = venta.medioPago && venta.medioPago.trim() !== '';
    const tieneCantidad = venta.cantidad && parseFloat(venta.cantidad) > 0;
    
    // Si tiene CAMPO ALERTA (Producto O Precio)
    if (tieneProducto || tienePrecio) {
      // Debe tener TODOS los campos obligatorios
      if (!tieneProducto || !tieneMedioPago || !tienePrecio || !tieneCantidad) {
        filasProblematicas.push({
          fila: index + 1,
          producto: tieneProducto,
          medioPago: tieneMedioPago,
          precio: tienePrecio,
          cantidad: tieneCantidad
        });
      }
    }
  });
  
  // Si hay filas problemáticas, lanzar error y NO guardar nada
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
  
  // =====================================================
  // FILTRAR VENTAS VÁLIDAS (solo filas realmente completas)
  // =====================================================
  const ventasValidas = ventas.filter(venta =>
    venta.producto && 
    venta.producto.trim() !== '' &&
    venta.medioPago && 
    venta.medioPago.trim() !== '' &&
    venta.precioUnitario && 
    parseFloat(venta.precioUnitario) > 0 &&
    venta.cantidad && 
    parseFloat(venta.cantidad) > 0
  );
  
  if (ventasValidas.length === 0) {
    throw new Error("No hay ventas válidas para registrar. Asegúrate de completar: Producto, Medio de Pago, Precio y Cantidad.");
  }
  
  // =====================================================
  // REGISTRO EN LA HOJA (sin cambios - mantiene todo igual)
  // =====================================================
  // Ubicar la última fila usando la columna guía (Producto - columna C)
  const newRow = encontrarUltimaFila(sheet);
  
  // Contar cuántos Yapes hay en este registro múltiple
  const cantidadYapes = ventasValidas.filter(v => 
    v.medioPago.toUpperCase() === 'YAPE'
  ).length;
  
  // Solo aplicar formato si hay MÁS DE 1 Yape
  const aplicarFormatoYape = cantidadYapes > 1;
  
  // Registrar cada venta de forma consecutiva
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
    
    // PINTAR CELDA DE PRODUCTO SI ES YAPE Y HAY MÚLTIPLES YAPES
    if (aplicarFormatoYape && venta.medioPago.toUpperCase() === 'YAPE') {
      sheet.getRange(currentRow, 3).setBackground('#FFFF66'); // Amarillo intenso
      ultimaFilaYape = currentRow; // Guardar la última fila Yape
    }
  });
  
  // APLICAR LÍNEA NEGRA EN LA ÚLTIMA FILA YAPE SI HAY MÚLTIPLES
  if (aplicarFormatoYape && ultimaFilaYape > 0) {
    sheet.getRange(ultimaFilaYape, 3).setBorder(
      null, null, true, null, // solo borde inferior
      null, null, 
      '#000000', // Color NEGRO para la línea
      SpreadsheetApp.BorderStyle.SOLID_MEDIUM
    );
  }
  
  return `${ventasValidas.length} venta(s) registrada(s) correctamente`;
}


// ============================================
// BATERÍA DE PRUEBAS - MULTIVENTA
// ============================================

function EJECUTAR_TODAS_LAS_PRUEBAS_MULTIVENTA() {
  Logger.clear();
  Logger.log('🧪 ============================================');
  Logger.log('🧪 INICIANDO BATERÍA DE PRUEBAS - MULTIVENTA');
  Logger.log('🧪 ============================================\n');
  
  const resultados = {
    total: 0,
    exitosas: 0,
    fallidas: 0,
    detalles: []
  };
  
  // ====================================
  // PRUEBAS DE CONFIGURACIÓN
  // ====================================
  ejecutarPrueba('TEST 1: Verificar Spreadsheet ID', test_spreadsheetId, resultados);
  ejecutarPrueba('TEST 2: Verificar acceso a hoja Ventas', test_hojaVentas, resultados);
  ejecutarPrueba('TEST 3: Verificar acceso a hoja Cat', test_hojaCat, resultados);
  ejecutarPrueba('TEST 4: Verificar acceso a hoja Mpago', test_hojaMpago, resultados);
  ejecutarPrueba('TEST 5: Verificar acceso a hoja Bcat', test_hojaBcat, resultados);
  
  // ====================================
  // PRUEBAS DE FUNCIONES GET
  // ====================================
  ejecutarPrueba('TEST 6: getCategorias()', test_getCategorias, resultados);
  ejecutarPrueba('TEST 7: getModosPago()', test_getModosPago, resultados);
  ejecutarPrueba('TEST 8: getMediosPago() [alias]', test_getMediosPago, resultados);
  ejecutarPrueba('TEST 9: getCategoriasBoton()', test_getCategoriasBoton, resultados);
  
  // ====================================
  // PRUEBAS DE FUNCIONES AUXILIARES
  // ====================================
  ejecutarPrueba('TEST 10: obtenerFechaPeru()', test_obtenerFechaPeru, resultados);
  ejecutarPrueba('TEST 11: encontrarUltimaFila()', test_encontrarUltimaFila, resultados);
  
  // ====================================
  // PRUEBAS DE VALIDACIÓN
  // ====================================
  ejecutarPrueba('TEST 12: registrarVentasMultiples() - Array vacío', test_arrayVacio, resultados);
  ejecutarPrueba('TEST 13: registrarVentasMultiples() - Datos null', test_datosNull, resultados);
  ejecutarPrueba('TEST 14: registrarVentasMultiples() - Datos no array', test_datosNoArray, resultados);
  ejecutarPrueba('TEST 15: registrarVentasMultiples() - Fila incompleta con Producto', test_filaIncompletaProducto, resultados);
  ejecutarPrueba('TEST 16: registrarVentasMultiples() - Fila incompleta con Precio', test_filaIncompletaPrecio, resultados);
  ejecutarPrueba('TEST 17: registrarVentasMultiples() - Fila vacía (ignorar)', test_filaVacia, resultados);
  ejecutarPrueba('TEST 18: registrarVentasMultiples() - Venta válida simple', test_ventaValidaSimple, resultados);
  ejecutarPrueba('TEST 19: registrarVentasMultiples() - Múltiples ventas válidas', test_ventasValidasMultiples, resultados);
  ejecutarPrueba('TEST 20: registrarVentasMultiples() - Múltiples Yapes (formato)', test_multiplesYapes, resultados);
  
  // ====================================
  // RESUMEN FINAL
  // ====================================
  Logger.log('\n🧪 ============================================');
  Logger.log('🧪 RESUMEN DE PRUEBAS');
  Logger.log('🧪 ============================================');
  Logger.log(`✅ Total de pruebas: ${resultados.total}`);
  Logger.log(`✅ Exitosas: ${resultados.exitosas}`);
  Logger.log(`❌ Fallidas: ${resultados.fallidas}`);
  Logger.log(`📊 Porcentaje de éxito: ${((resultados.exitosas/resultados.total)*100).toFixed(2)}%`);
  Logger.log('🧪 ============================================\n');
  
  // Mostrar detalles de pruebas fallidas
  if (resultados.fallidas > 0) {
    Logger.log('\n⚠️ DETALLES DE PRUEBAS FALLIDAS:');
    Logger.log('⚠️ ============================================');
    resultados.detalles
      .filter(d => d.estado === 'FALLIDA')
      .forEach(d => {
        Logger.log(`\n❌ ${d.nombre}`);
        Logger.log(`   Error: ${d.mensaje}`);
      });
  }
  
  return resultados;
}

// ====================================
// FUNCIÓN AUXILIAR PARA EJECUTAR PRUEBAS
// ====================================
function ejecutarPrueba(nombre, funcionPrueba, resultados) {
  resultados.total++;
  try {
    funcionPrueba();
    resultados.exitosas++;
    resultados.detalles.push({
      nombre: nombre,
      estado: 'EXITOSA',
      mensaje: 'OK'
    });
    Logger.log(`✅ ${nombre}: EXITOSA`);
  } catch (error) {
    resultados.fallidas++;
    resultados.detalles.push({
      nombre: nombre,
      estado: 'FALLIDA',
      mensaje: error.message
    });
    Logger.log(`❌ ${nombre}: FALLIDA - ${error.message}`);
  }
}

// ====================================
// PRUEBAS DE CONFIGURACIÓN
// ====================================
function test_spreadsheetId() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === '') {
    throw new Error('SPREADSHEET_ID no definido');
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss) {
    throw new Error('No se puede abrir el Spreadsheet');
  }
}

function test_hojaVentas() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_VENTAS);
  if (!sheet) {
    throw new Error(`Hoja "${HOJA_VENTAS}" no encontrada`);
  }
}

function test_hojaCat() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_CATEGORIAS);
  if (!sheet) {
    throw new Error(`Hoja "${HOJA_CATEGORIAS}" no encontrada`);
  }
}

function test_hojaMpago() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_MEDIOS_PAGO);
  if (!sheet) {
    throw new Error(`Hoja "${HOJA_MEDIOS_PAGO}" no encontrada`);
  }
}

function test_hojaBcat() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName('Bcat');
  if (!sheet) {
    throw new Error('Hoja "Bcat" no encontrada');
  }
}

// ====================================
// PRUEBAS DE FUNCIONES GET
// ====================================
function test_getCategorias() {
  const categorias = getCategorias();
  if (!Array.isArray(categorias)) {
    throw new Error('getCategorias() no devuelve un array');
  }
  if (categorias.length === 0) {
    throw new Error('getCategorias() devuelve array vacío');
  }
  Logger.log(`   → Categorías encontradas: ${categorias.length}`);
}

function test_getModosPago() {
  const modosPago = getModosPago();
  if (!Array.isArray(modosPago)) {
    throw new Error('getModosPago() no devuelve un array');
  }
  if (modosPago.length === 0) {
    throw new Error('getModosPago() devuelve array vacío');
  }
  Logger.log(`   → Modos de pago encontrados: ${modosPago.length}`);
}

function test_getMediosPago() {
  const mediosPago = getMediosPago();
  if (!Array.isArray(mediosPago)) {
    throw new Error('getMediosPago() no devuelve un array');
  }
  if (mediosPago.length === 0) {
    throw new Error('getMediosPago() devuelve array vacío');
  }
  Logger.log(`   → Medios de pago encontrados: ${mediosPago.length}`);
}

function test_getCategoriasBoton() {
  const categoriasBoton = getCategoriasBoton();
  if (!Array.isArray(categoriasBoton)) {
    throw new Error('getCategoriasBoton() no devuelve un array');
  }
  // Es válido que devuelva array vacío si Bcat está vacía
  Logger.log(`   → Botones de categoría encontrados: ${categoriasBoton.length}`);
  
  if (categoriasBoton.length > 0) {
    const primerBoton = categoriasBoton[0];
    if (!primerBoton.categoria || !primerBoton.boton) {
      throw new Error('Estructura de botón incorrecta (debe tener .categoria y .boton)');
    }
  }
}

// ====================================
// PRUEBAS DE FUNCIONES AUXILIARES
// ====================================
function test_obtenerFechaPeru() {
  const fecha = obtenerFechaPeru();
  if (!fecha || typeof fecha !== 'string') {
    throw new Error('obtenerFechaPeru() no devuelve string');
  }
  // Verificar formato dd/MM/yyyy
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(fecha)) {
    throw new Error(`Formato de fecha incorrecto: ${fecha} (esperado: dd/MM/yyyy)`);
  }
  Logger.log(`   → Fecha: ${fecha}`);
}

function test_encontrarUltimaFila() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_VENTAS);
  const ultimaFila = encontrarUltimaFila(sheet);
  
  if (typeof ultimaFila !== 'number') {
    throw new Error('encontrarUltimaFila() no devuelve un número');
  }
  if (ultimaFila < 1) {
    throw new Error(`Última fila inválida: ${ultimaFila}`);
  }
  Logger.log(`   → Última fila: ${ultimaFila}`);
}

// ====================================
// PRUEBAS DE VALIDACIÓN
// ====================================
function test_arrayVacio() {
  try {
    registrarVentasMultiples([]);
    throw new Error('Debería lanzar error con array vacío');
  } catch (error) {
    if (!error.message.includes('vacío')) {
      throw new Error(`Mensaje de error incorrecto: ${error.message}`);
    }
  }
}

function test_datosNull() {
  try {
    registrarVentasMultiples(null);
    throw new Error('Debería lanzar error con datos null');
  } catch (error) {
    if (!error.message.includes('No se recibieron datos')) {
      throw new Error(`Mensaje de error incorrecto: ${error.message}`);
    }
  }
}

function test_datosNoArray() {
  try {
    registrarVentasMultiples("no es un array");
    throw new Error('Debería lanzar error con datos no array');
  } catch (error) {
    if (!error.message.includes('no son un array válido')) {
      throw new Error(`Mensaje de error incorrecto: ${error.message}`);
    }
  }
}

function test_filaIncompletaProducto() {
  const ventaIncompleta = [{
    categoria: 'Impresiones',
    producto: 'Volante A5',
    medioPago: '', // FALTA
    precioUnitario: '',
    cantidad: ''
  }];
  
  try {
    registrarVentasMultiples(ventaIncompleta);
    throw new Error('Debería lanzar error con fila incompleta (solo Producto)');
  } catch (error) {
    if (!error.message.includes('campos incompletos')) {
      throw new Error(`Mensaje de error incorrecto: ${error.message}`);
    }
  }
}

function test_filaIncompletaPrecio() {
  const ventaIncompleta = [{
    categoria: '',
    producto: '', // FALTA
    medioPago: '',
    precioUnitario: '10.50',
    cantidad: ''
  }];
  
  try {
    registrarVentasMultiples(ventaIncompleta);
    throw new Error('Debería lanzar error con fila incompleta (solo Precio)');
  } catch (error) {
    if (!error.message.includes('campos incompletos')) {
      throw new Error(`Mensaje de error incorrecto: ${error.message}`);
    }
  }
}

function test_filaVacia() {
  const ventaVacia = [{
    categoria: 'Impresiones',
    producto: '',
    medioPago: 'Yape',
    precioUnitario: '',
    cantidad: '1'
  }];
  
  try {
    registrarVentasMultiples(ventaVacia);
    throw new Error('Debería lanzar error porque no hay ventas válidas');
  } catch (error) {
    if (!error.message.includes('No hay ventas válidas')) {
      throw new Error(`Mensaje de error incorrecto: ${error.message}`);
    }
  }
}

function test_ventaValidaSimple() {
  // NOTA: Esta prueba SÍ escribirá en la hoja
  const ventaValida = [{
    categoria: 'TEST',
    producto: 'Producto TEST',
    medioPago: 'Efectivo',
    precioUnitario: '10.00',
    cantidad: '1'
  }];
  
  const resultado = registrarVentasMultiples(ventaValida);
  if (!resultado.includes('1 venta(s) registrada(s)')) {
    throw new Error(`Resultado inesperado: ${resultado}`);
  }
  Logger.log(`   → ${resultado}`);
}

function test_ventasValidasMultiples() {
  // NOTA: Esta prueba SÍ escribirá en la hoja
  const ventas = [
    {
      categoria: 'TEST',
      producto: 'Producto TEST 1',
      medioPago: 'Efectivo',
      precioUnitario: '10.00',
      cantidad: '2'
    },
    {
      categoria: 'TEST',
      producto: 'Producto TEST 2',
      medioPago: 'Yape',
      precioUnitario: '15.50',
      cantidad: '1'
    },
    {
      categoria: '',
      producto: '', // Fila vacía - debe ignorarse
      medioPago: '',
      precioUnitario: '',
      cantidad: '1'
    }
  ];
  
  const resultado = registrarVentasMultiples(ventas);
  if (!resultado.includes('2 venta(s) registrada(s)')) {
    throw new Error(`Resultado inesperado: ${resultado}`);
  }
  Logger.log(`   → ${resultado}`);
}

function test_multiplesYapes() {
  // NOTA: Esta prueba SÍ escribirá en la hoja y aplicará formato
  const ventas = [
    {
      categoria: 'TEST',
      producto: 'Yape TEST 1',
      medioPago: 'Yape',
      precioUnitario: '10.00',
      cantidad: '1'
    },
    {
      categoria: 'TEST',
      producto: 'Yape TEST 2',
      medioPago: 'Yape',
      precioUnitario: '20.00',
      cantidad: '1'
    },
    {
      categoria: 'TEST',
      producto: 'Yape TEST 3',
      medioPago: 'Yape',
      precioUnitario: '30.00',
      cantidad: '1'
    }
  ];
  
  const resultado = registrarVentasMultiples(ventas);
  if (!resultado.includes('3 venta(s) registrada(s)')) {
    throw new Error(`Resultado inesperado: ${resultado}`);
  }
  Logger.log(`   → ${resultado} (con formato amarillo y línea negra)`);
}
