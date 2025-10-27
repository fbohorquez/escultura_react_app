// Script para probar la configuración dinámica por URL
// Ejecutar en la consola del navegador

// Configuración para ocultar el logo de escultura
const configHideLogo = {
	header: {
		showEsculturaLogo: false
	}
};

// Configuración para mostrar el logo de escultura (equivalente al comportamiento por defecto)
const configShowLogo = {
	header: {
		showEsculturaLogo: true
	}
};

// Función para generar URLs con configuración
function generateConfigUrl(config) {
	const encodedConfig = btoa(JSON.stringify(config));
	const currentUrl = new URL(window.location);
	currentUrl.searchParams.set('config', encodedConfig);
	return currentUrl.toString();
}

console.log("=== SISTEMA DE CONFIGURACIÓN DINÁMICA ===");
console.log("\n1. URL sin configuración (comportamiento por defecto - logo visible):");
console.log(window.location.origin + window.location.pathname);

console.log("\n2. URL para OCULTAR el logo de escultura:");
console.log(generateConfigUrl(configHideLogo));

console.log("\n3. URL para MOSTRAR el logo de escultura (explícito):");
console.log(generateConfigUrl(configShowLogo));

console.log("\n=== INSTRUCCIONES ===");
console.log("1. Copia cualquiera de las URLs de arriba");
console.log("2. Navega a esa URL");
console.log("3. Observa si el logo de escultura aparece o no en el header");
console.log("4. Sin configuración o con showEsculturaLogo: true → Logo visible");
console.log("5. Con showEsculturaLogo: false → Logo oculto");
