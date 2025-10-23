// js/api.js

(function() {
    // Función central reutilizable para hacer llamadas a nuestro backend en Vercel
    async function apiCall(action, body = null) {
        try {
            const options = {
                method: 'POST', // Usamos POST para todas las acciones para poder enviar datos en el cuerpo
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            // Construimos la URL completa a nuestra función de Vercel
            const response = await fetch(`/api/index?action=${action}`, options);

            // Si la respuesta no es exitosa, leemos el error y lo lanzamos
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error desconocido desde la API');
            }

            // Si todo fue bien, devolvemos los datos en formato JSON
            return await response.json();

        } catch (error) {
            console.error(`Error en la llamada a la API para la acción "${action}":`, error);
            // Re-lanzamos el error para que la función que llamó sepa que algo salió mal
            throw error;
        }
    }

    // Creamos el objeto apiClient que será usado por index.html
    const apiClient = {
        getMissingProducts: function() {
            return apiCall('getMissing');
        },
        addProduct: function(product) {
            return apiCall('add', { 
                productName: product.product_name,
                quantity: product.quantity, 
                supplierName: product.supplier_name,
                priority: product.priority
            });
        },
        markAsReceived: function(productId) {
            return apiCall('markReceived', { id: productId });
        },
        deleteProduct: function(productId) {
            return apiCall('delete', { id: productId });
        },
        getHistory: function() {
            return apiCall('getHistory');
        },
        getMetrics: function() {
            return apiCall('getMetrics');
        },
        // --- NUEVA FUNCIÓN PARA EL ASISTENTE DE IA ---
        // Esta función llamará a la acción 'chatWithGroq' que creamos en el backend.
        chatWithGroq: function(message, history) {
            return apiCall('chatWithGroq', { 
                message: message, 
                history: history 
            });
        }
    };

    // Hacemos el objeto apiClient accesible globalmente para que index.html pueda usarlo
    window.apiClient = apiClient;

})(); // La función se auto-ejecuta al cargar el script

