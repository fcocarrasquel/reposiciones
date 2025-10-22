// 📋 API CLIENT PARA VERCELL - COMPATIBLE CON TU API ORIGINAL
// ✅ Usa query parameters como tu API original

class ApiClient {
    constructor() {
        this.baseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5501/api' 
            : '/api';
    }

    async request(action, data = null) {
        try {
            // Usar query parameters como tu API original
            const url = `${this.baseUrl}?action=${action}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error desconocido en la API');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Obtener productos faltantes
    async getMissingProducts() {
        return await this.request('getMissing');
    }

    // Añadir producto
    async addProduct(productData) {
        return await this.request('add', {
            productName: productData.product_name,
            supplierName: productData.supplier_name,
            priority: productData.priority
        });
    }

    // Marcar producto como recibido
    async markAsReceived(productId) {
        return await this.request('markReceived', { id: productId });
    }

    // Eliminar producto
    async deleteProduct(productId) {
        return await this.request('delete', { id: productId });
    }

    // Obtener historial
    async getHistory() {
        return await this.request('getHistory');
    }

    // Obtener métricas
    async getMetrics() {
        return await this.request('getMetrics');
    }
}

// Crear instancia global
window.apiClient = new ApiClient();