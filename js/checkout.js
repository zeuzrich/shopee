// Checkout JavaScript
class Checkout {
    constructor() {
        this.productPrice = 197.00;
        this.quantity = 1;
        this.shippingCost = 0;
        this.discountAmount = 0;
        this.selectedShipping = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupMasks();
        this.updateTotal();
    }
    
    bindEvents() {
        // CEP search
        document.getElementById('cep').addEventListener('blur', () => this.searchCEP());
        document.querySelector('.btn-search-cep').addEventListener('click', () => this.searchCEP());
        
        // Coupon
        document.querySelector('.btn-apply-coupon').addEventListener('click', () => this.applyCoupon());
        
        // Checkout button
        document.getElementById('btn-checkout').addEventListener('click', () => this.processCheckout());
        
        // Form validation
        this.setupFormValidation();
    }
    
    setupMasks() {
        // CEP mask
        const cepInput = document.getElementById('cep');
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
        
        // CPF mask
        const cpfInput = document.getElementById('document');
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
        
        // Phone mask
        const phoneInput = document.getElementById('phone');
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }
    
    async searchCEP() {
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.showError('CEP deve conter 8 dígitos');
            return;
        }
        
        try {
            // Search address by CEP
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                this.showError('CEP não encontrado');
                return;
            }
            
            // Fill address fields
            document.getElementById('street').value = data.logradouro;
            document.getElementById('neighborhood').value = data.bairro;
            document.getElementById('city').value = data.localidade;
            document.getElementById('state').value = data.uf;
            
            // Calculate shipping
            this.calculateShipping(cep);
            
        } catch (error) {
            this.showError('Erro ao buscar CEP');
        }
    }
    
    calculateShipping(cep) {
        const shippingOptions = document.getElementById('shipping-options');
        
        // Simulate shipping calculation
        shippingOptions.innerHTML = `
            <div class="shipping-option" onclick="checkout.selectShipping('pac', 15.90)">
                <input type="radio" name="shipping" value="pac">
                <div class="shipping-info">
                    <div class="shipping-name">PAC</div>
                    <div class="shipping-time">Entrega em até 10 dias úteis</div>
                </div>
                <div class="shipping-price">R$ 15,90</div>
            </div>
            <div class="shipping-option" onclick="checkout.selectShipping('sedex', 25.90)">
                <input type="radio" name="shipping" value="sedex">
                <div class="shipping-info">
                    <div class="shipping-name">SEDEX</div>
                    <div class="shipping-time">Entrega em até 5 dias úteis</div>
                </div>
                <div class="shipping-price">R$ 25,90</div>
            </div>
            <div class="shipping-option" onclick="checkout.selectShipping('express', 35.90)">
                <input type="radio" name="shipping" value="express">
                <div class="shipping-info">
                    <div class="shipping-name">Entrega Expressa</div>
                    <div class="shipping-time">Entrega em até 2 dias úteis</div>
                </div>
                <div class="shipping-price">R$ 35,90</div>
            </div>
        `;
    }
    
    selectShipping(type, cost) {
        // Remove previous selection
        document.querySelectorAll('.shipping-option').forEach(option => {
            option.classList.remove('selected');
            option.querySelector('input').checked = false;
        });
        
        // Select current option
        event.currentTarget.classList.add('selected');
        event.currentTarget.querySelector('input').checked = true;
        
        this.selectedShipping = type;
        this.shippingCost = cost;
        
        this.updateTotal();
        this.validateForm();
    }
    
    applyCoupon() {
        const couponCode = document.getElementById('coupon').value.trim().toUpperCase();
        
        if (!couponCode) {
            this.showError('Digite um código de desconto');
            return;
        }
        
        // Simulate coupon validation
        const validCoupons = {
            'DESCONTO10': 0.10,
            'PRIMEIRA20': 0.20,
            'FRETE50': 0.50
        };
        
        if (validCoupons[couponCode]) {
            const discountPercent = validCoupons[couponCode];
            this.discountAmount = this.productPrice * this.quantity * discountPercent;
            
            document.getElementById('discount-row').style.display = 'flex';
            document.getElementById('discount-amount').textContent = `-R$ ${this.discountAmount.toFixed(2).replace('.', ',')}`;
            
            this.updateTotal();
            this.showSuccess('Cupom aplicado com sucesso!');
        } else {
            this.showError('Cupom inválido');
        }
    }
    
    updateTotal() {
        const subtotal = this.productPrice * this.quantity;
        const total = subtotal + this.shippingCost - this.discountAmount;
        
        document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        document.getElementById('shipping-cost').textContent = this.shippingCost > 0 ? 
            `R$ ${this.shippingCost.toFixed(2).replace('.', ',')}` : 'A calcular';
        document.getElementById('total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
    
    setupFormValidation() {
        const requiredFields = [
            'cep', 'street', 'number', 'neighborhood', 'city', 'state',
            'fullName', 'document', 'email', 'phone'
        ];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('blur', () => this.validateForm());
            field.addEventListener('input', () => this.validateForm());
        });
    }
    
    validateForm() {
        const requiredFields = [
            'cep', 'street', 'number', 'neighborhood', 'city', 'state',
            'fullName', 'document', 'email', 'phone'
        ];
        
        let isValid = true;
        
        // Check required fields
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                isValid = false;
            }
        });
        
        // Check shipping selection
        if (!this.selectedShipping) {
            isValid = false;
        }
        
        // Enable/disable checkout button
        const checkoutBtn = document.getElementById('btn-checkout');
        checkoutBtn.disabled = !isValid;
    }
    
    async processCheckout() {
        if (!this.validateCheckoutData()) {
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Prepare order data
            const orderData = this.prepareOrderData();
            
            // Create payment with Ativo
            const paymentResponse = await this.createAtivoPayment(orderData);
            
            if (paymentResponse.success) {
                // Redirect to payment page
                window.location.href = paymentResponse.payment_url;
            } else {
                throw new Error(paymentResponse.message || 'Erro ao processar pagamento');
            }
            
        } catch (error) {
            this.showError('Erro ao processar pedido: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    validateCheckoutData() {
        // Validate CPF
        const cpf = document.getElementById('document').value.replace(/\D/g, '');
        if (!this.isValidCPF(cpf)) {
            this.showError('CPF inválido');
            return false;
        }
        
        // Validate email
        const email = document.getElementById('email').value;
        if (!this.isValidEmail(email)) {
            this.showError('E-mail inválido');
            return false;
        }
        
        return true;
    }
    
    prepareOrderData() {
        const total = (this.productPrice * this.quantity) + this.shippingCost - this.discountAmount;
        
        return {
            customer: {
                name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                document: document.getElementById('document').value.replace(/\D/g, ''),
                phone: document.getElementById('phone').value.replace(/\D/g, '')
            },
            shipping: {
                address: {
                    street: document.getElementById('street').value,
                    number: document.getElementById('number').value,
                    complement: document.getElementById('complement').value,
                    neighborhood: document.getElementById('neighborhood').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    zipcode: document.getElementById('cep').value.replace(/\D/g, '')
                },
                method: this.selectedShipping,
                cost: this.shippingCost
            },
            items: [{
                name: 'Kit Completo de Cuidados',
                quantity: this.quantity,
                price: this.productPrice
            }],
            payment: {
                amount: Math.round(total * 100), // Amount in cents
                currency: 'BRL'
            },
            discount: this.discountAmount
        };
    }
    
    async createAtivoPayment(orderData) {
        // This would be your backend endpoint that communicates with Ativo
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        return await response.json();
    }
    
    isValidCPF(cpf) {
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        
        return remainder === parseInt(cpf.charAt(10));
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showLoading(show) {
        const modal = document.getElementById('loading-modal');
        modal.style.display = show ? 'flex' : 'none';
    }
    
    showError(message) {
        alert('Erro: ' + message);
    }
    
    showSuccess(message) {
        alert('Sucesso: ' + message);
    }
}

// Quantity controls
function updateQuantity(change) {
    const quantityElement = document.getElementById('quantity');
    let currentQuantity = parseInt(quantityElement.textContent);
    
    currentQuantity += change;
    if (currentQuantity < 1) currentQuantity = 1;
    if (currentQuantity > 10) currentQuantity = 10;
    
    quantityElement.textContent = currentQuantity;
    checkout.quantity = currentQuantity;
    checkout.updateTotal();
}

// Initialize checkout
let checkout;
document.addEventListener('DOMContentLoaded', () => {
    checkout = new Checkout();
});