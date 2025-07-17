<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Ativo API Configuration
define('ATIVO_API_URL', 'https://api.useativo.co/v1');
define('ATIVO_API_KEY', 'YOUR_ATIVO_API_KEY'); // Replace with your actual API key
define('ATIVO_SECRET_KEY', 'YOUR_ATIVO_SECRET_KEY'); // Replace with your actual secret key

function createAtivoPayment($orderData) {
    $paymentData = [
        'amount' => $orderData['payment']['amount'],
        'currency' => $orderData['payment']['currency'],
        'description' => 'Pedido - Kit Completo de Cuidados',
        'customer' => [
            'name' => $orderData['customer']['name'],
            'email' => $orderData['customer']['email'],
            'document' => $orderData['customer']['document'],
            'phone' => $orderData['customer']['phone']
        ],
        'billing_address' => [
            'street' => $orderData['shipping']['address']['street'],
            'number' => $orderData['shipping']['address']['number'],
            'complement' => $orderData['shipping']['address']['complement'],
            'neighborhood' => $orderData['shipping']['address']['neighborhood'],
            'city' => $orderData['shipping']['address']['city'],
            'state' => $orderData['shipping']['address']['state'],
            'zipcode' => $orderData['shipping']['address']['zipcode'],
            'country' => 'BR'
        ],
        'shipping_address' => [
            'street' => $orderData['shipping']['address']['street'],
            'number' => $orderData['shipping']['address']['number'],
            'complement' => $orderData['shipping']['address']['complement'],
            'neighborhood' => $orderData['shipping']['address']['neighborhood'],
            'city' => $orderData['shipping']['address']['city'],
            'state' => $orderData['shipping']['address']['state'],
            'zipcode' => $orderData['shipping']['address']['zipcode'],
            'country' => 'BR'
        ],
        'items' => array_map(function($item) {
            return [
                'name' => $item['name'],
                'quantity' => $item['quantity'],
                'price' => (int)($item['price'] * 100) // Convert to cents
            ];
        }, $orderData['items']),
        'payment_methods' => ['credit_card', 'debit_card', 'pix', 'boleto'],
        'success_url' => 'https://yoursite.com/success',
        'cancel_url' => 'https://yoursite.com/cancel',
        'notification_url' => 'https://yoursite.com/webhook'
    ];
    
    // Add shipping cost as item if applicable
    if ($orderData['shipping']['cost'] > 0) {
        $paymentData['items'][] = [
            'name' => 'Frete - ' . strtoupper($orderData['shipping']['method']),
            'quantity' => 1,
            'price' => (int)($orderData['shipping']['cost'] * 100)
        ];
    }
    
    // Add discount if applicable
    if ($orderData['discount'] > 0) {
        $paymentData['discount'] = [
            'type' => 'fixed',
            'value' => (int)($orderData['discount'] * 100)
        ];
    }
    
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => ATIVO_API_URL . '/payments',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($paymentData),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . ATIVO_API_KEY,
            'Content-Type: application/json',
            'Accept: application/json'
        ],
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    
    curl_close($curl);
    
    if ($httpCode === 200 || $httpCode === 201) {
        $responseData = json_decode($response, true);
        return [
            'success' => true,
            'payment_id' => $responseData['id'],
            'payment_url' => $responseData['checkout_url'],
            'status' => $responseData['status']
        ];
    } else {
        $errorData = json_decode($response, true);
        return [
            'success' => false,
            'message' => $errorData['message'] ?? 'Erro ao criar pagamento',
            'errors' => $errorData['errors'] ?? []
        ];
    }
}

function saveOrder($orderData, $paymentId) {
    // Here you would save the order to your database
    // This is a simplified example
    
    $orderNumber = 'ORD-' . date('Ymd') . '-' . rand(1000, 9999);
    
    // Save to database (implement your database logic here)
    // Example:
    /*
    $pdo = new PDO('mysql:host=localhost;dbname=your_db', $username, $password);
    $stmt = $pdo->prepare("
        INSERT INTO orders (order_number, payment_id, customer_data, shipping_data, items_data, total_amount, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");
    $stmt->execute([
        $orderNumber,
        $paymentId,
        json_encode($orderData['customer']),
        json_encode($orderData['shipping']),
        json_encode($orderData['items']),
        $orderData['payment']['amount'] / 100
    ]);
    */
    
    return $orderNumber;
}

// Main execution
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
        exit;
    }
    
    try {
        // Create payment with Ativo
        $paymentResult = createAtivoPayment($input);
        
        if ($paymentResult['success']) {
            // Save order to database
            $orderNumber = saveOrder($input, $paymentResult['payment_id']);
            
            echo json_encode([
                'success' => true,
                'payment_url' => $paymentResult['payment_url'],
                'payment_id' => $paymentResult['payment_id'],
                'order_number' => $orderNumber
            ]);
        } else {
            http_response_code(400);
            echo json_encode($paymentResult);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erro interno do servidor: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
}
?>