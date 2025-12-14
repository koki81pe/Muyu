//// ============================================
//// MULTIVENTA.GS - MÓDULO DE VENTA MÚLTIPLE
//// ============================================

//// CARGAR MEDIOS DE PAGO (alias para compatibilidad)
function getMediosPago() {
  return getModosPago();
}

//// REGISTRAR VENTAS MÚLTIPLES
function registrarVentasMultiples(ventas) {
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
