<?php
// POST로 전달된 값을 받아오기
$data = $_POST;

// 이메일 설정
$to = "crazat@naver.com";
$subject = "규림 다이어트 초기 설문 결과";
$headers = "From: survey@yourdomain.com\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// HTML 메일 내용 생성
$message = "<html><body>";
$message .= "<h1>규림 다이어트 초기 설문 결과</h1>";
foreach($data as $key => $value) {
    if(is_array($value)) {
        $message .= "<p><strong>" . htmlspecialchars($key) . ":</strong> " . implode(", ", array_map('htmlspecialchars', $value)) . "</p>";
    } else {
        $message .= "<p><strong>" . htmlspecialchars($key) . ":</strong> " . htmlspecialchars($value) . "</p>";
    }
}
$message .= "</body></html>";

// 메일 전송
mail($to, $subject, $message, $headers);

// 전송 후 리다이렉트(또는 확인 메세지 표시 페이지)
header("Location: thanks.html");