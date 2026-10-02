# Website cá nhân Full-stack

## Công nghệ
- Node.js + Express
- SQLite
- bcryptjs để hash mật khẩu
- express-session để quản lý phiên đăng nhập
- HTML/CSS/JavaScript thuần

## Chạy trên máy tính
Cài Node.js, sau đó trong thư mục dự án:

```bash
npm install
npm start
```

Mở: http://localhost:3000

Database `users.db` sẽ được tạo tự động.

## Lưu ý khi triển khai thật
Đặt biến môi trường `SESSION_SECRET` thành một chuỗi bí mật mạnh và bật HTTPS.
Database SQLite phù hợp cho bản nhỏ/demo. Nếu deploy trên nền tảng có filesystem tạm thời, nên chuyển sang PostgreSQL hoặc dịch vụ database bền vững.
