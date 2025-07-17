<?php
header('Content-Type: application/json');

// Ativo Webhook Handler
define('ATIVO_SECRET_KEY', 'YOUR_ATIVO_SECRET_KEY'); // Replace with your actual secret key

function verifyWebhookSignature($payload, $signature) {
    $expectedSignature = hash_hmac('sha256', $payload, ATIVO_SECRET_KEY);
    return hash_equals($expectedSignature, $signature);
}

function updateOrderStatus($paymentId, $status, $paymentData) {
    // Update order status in your database
    // This is a simplified example
    
    /*
    $pdo = new PDO('mysql:host=localhost;dbname=your_db', $username, $password);
    $stmt = $pdo->prepare("UPDATE orders SET status = ?, payment_data = ?, updated_at = NOW() WHERE payment_id = ?");
    $stmt->execute([$status, json_encode($paymentData), $paymentId]);
    */
    
    // Send confirmation email to customer if payment is approved
    if ($status === 'paid') {
        sendConfirmationEmail($paymentId);
    }
    
    return true;
}

function sendConfirmationEmail($paymentId) {
    // Get order details from database
    // Send confirmation email to customer
    // This is where you would implement your email logic
    
    /*
    $pdo = new PDO('mysql:host=localhost;dbname=your_db', $username, $password);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE payment_id = ?");
    $stmt->execute([$paymentId]);
    $order = $stmt->fetch();
    
    if ($order) {
        $customerData = json_decode($order['customer_data'], true);
        $to = $customerData['email'];
        $subject = 'Confirmação de Pagamento - Pedido ' . $order['order_number'];
        $message = 'Seu pagamento foi confirmado...';
        
        mail($to, $subject, $message);
    }
    */
}

// Main webhook handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_ATIVO_SIGNATURE'] ?? '';
    
    // Verify webhook signature
    if (!verifyWebhookSignature($payload, $signature)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
    
    $data = json_decode($payload, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }
    
    try {
        $paymentId = $data['id'];
        $status = $data['status'];
        
        // Map Ativo status to your internal status
        $statusMap = [
            'pending' => 'pending',
            'processing' => 'processing',
            'paid' => 'paid',
            'failed' => 'failed',
            'cancelled' => 'cancelled',
            'refunded' => 'refunded'
        ];
        
        $internalStatus = $statusMap[$status] ?? 'unknown';
        
        // Update order status
        updateOrderStatus($paymentId, $internalStatus, $data);
        
        // Log webhook for debugging
        error_log('Ativo Webhook: ' . $payload);
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        error_log('Webhook error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>