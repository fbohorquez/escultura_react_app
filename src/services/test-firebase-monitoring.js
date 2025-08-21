// test-firebase-monitoring.js
// Script de prueba para verificar el funcionamiento del sistema de monitoreo

/**
 * Pruebas básicas del sistema de monitoreo de Firebase
 * Ejecutar desde la consola del navegador después de cargar la aplicación
 */

const testFirebaseMonitoring = {
    
    /**
     * Prueba básica de las herramientas de diagnóstico
     */
    async testBasicDiagnostics() {
        console.log('🧪 Testing basic diagnostics...');
        
        if (typeof window.firebaseDiagnostics === 'undefined') {
            console.error('❌ firebaseDiagnostics not available. Make sure app is in development mode.');
            return false;
        }
        
        try {
            // Probar info
            const info = window.firebaseDiagnostics.info();
            console.log('✅ Info function works:', info);
            
            // Probar check
            const checkResult = await window.firebaseDiagnostics.check();
            console.log('✅ Check function works:', checkResult);
            
            return true;
        } catch (error) {
            console.error('❌ Basic diagnostics test failed:', error);
            return false;
        }
    },
    
    /**
     * Simula una pérdida de conectividad temporal
     */
    async testReconnectionScenario() {
        console.log('🧪 Testing reconnection scenario...');
        
        if (!window.firebaseDiagnostics) {
            console.error('❌ Diagnostics tools not available');
            return;
        }
        
        try {
            // 1. Verificar estado inicial
            console.log('1️⃣ Initial state:');
            const initialState = window.firebaseDiagnostics.info();
            
            // 2. Forzar reconexión para simular problema
            console.log('2️⃣ Forcing reconnection...');
            window.firebaseDiagnostics.reconnect();
            
            // 3. Esperar un momento
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 4. Verificar estado después
            console.log('3️⃣ State after reconnection:');
            const finalState = window.firebaseDiagnostics.info();
            
            console.log('✅ Reconnection test completed');
            return { initialState, finalState };
            
        } catch (error) {
            console.error('❌ Reconnection test failed:', error);
        }
    },
    
    /**
     * Monitorea las conexiones durante un tiempo determinado
     */
    async monitorConnections(durationSeconds = 60) {
        console.log(`🧪 Monitoring connections for ${durationSeconds} seconds...`);
        
        if (!window.firebaseDiagnostics) {
            console.error('❌ Diagnostics tools not available');
            return;
        }
        
        const startTime = Date.now();
        const results = [];
        
        const monitor = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const info = window.firebaseDiagnostics.info();
            
            results.push({
                timestamp: new Date().toISOString(),
                elapsed,
                totalListeners: info.totalListeners,
                activeListeners: info.activeListeners.length,
                staleListeners: info.staleListeners.length
            });
            
            console.log(`📊 ${elapsed}s: ${info.activeListeners.length} active, ${info.staleListeners.length} stale`);
            
            if (elapsed >= durationSeconds) {
                clearInterval(monitor);
                console.log('✅ Monitoring completed');
                console.table(results);
                
                // Análisis de resultados
                const hasStaleListeners = results.some(r => r.staleListeners > 0);
                const listenerCountChanged = new Set(results.map(r => r.totalListeners)).size > 1;
                
                console.log('📈 Analysis:');
                console.log(`- Had stale listeners: ${hasStaleListeners ? '⚠️ Yes' : '✅ No'}`);
                console.log(`- Listener count changed: ${listenerCountChanged ? '⚠️ Yes' : '✅ No'}`);
            }
        }, 5000); // Check every 5 seconds
        
        return new Promise(resolve => {
            setTimeout(() => {
                clearInterval(monitor);
                resolve(results);
            }, durationSeconds * 1000);
        });
    },
    
    /**
     * Prueba de estrés: habilita y deshabilita logging rápidamente
     */
    testLoggingToggle() {
        console.log('🧪 Testing logging toggle...');
        
        if (!window.firebaseDiagnostics) {
            console.error('❌ Diagnostics tools not available');
            return;
        }
        
        try {
            // Toggle logging multiple times
            for (let i = 0; i < 5; i++) {
                window.firebaseDiagnostics.enableLogs();
                window.firebaseDiagnostics.disableLogs();
            }
            
            console.log('✅ Logging toggle test completed');
            return true;
        } catch (error) {
            console.error('❌ Logging toggle test failed:', error);
            return false;
        }
    },
    
    /**
     * Ejecuta todos los tests
     */
    async runAllTests() {
        console.log('🚀 Running all Firebase monitoring tests...');
        
        const results = {
            basicDiagnostics: await this.testBasicDiagnostics(),
            loggingToggle: this.testLoggingToggle(),
            reconnectionScenario: await this.testReconnectionScenario()
        };
        
        console.log('📋 Test Results:');
        console.table(results);
        
        const allPassed = Object.values(results).every(r => r === true || (r && typeof r === 'object'));
        console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
        
        return results;
    },
    
    /**
     * Ayuda sobre las funciones de prueba disponibles
     */
    help() {
        console.log(`
🧪 Firebase Monitoring Test Suite

Available test functions:
• testFirebaseMonitoring.testBasicDiagnostics() - Test basic diagnostic functions
• testFirebaseMonitoring.testReconnectionScenario() - Simulate reconnection
• testFirebaseMonitoring.monitorConnections(60) - Monitor for 60 seconds
• testFirebaseMonitoring.testLoggingToggle() - Test logging toggle
• testFirebaseMonitoring.runAllTests() - Run all tests
• testFirebaseMonitoring.help() - Show this help

Quick start:
testFirebaseMonitoring.runAllTests()

Long-term monitoring:
testFirebaseMonitoring.monitorConnections(300) // Monitor for 5 minutes
        `);
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.testFirebaseMonitoring = testFirebaseMonitoring;
    console.log('🧪 Firebase monitoring tests available at window.testFirebaseMonitoring');
    console.log('Run testFirebaseMonitoring.help() for available commands');
}

export default testFirebaseMonitoring;
