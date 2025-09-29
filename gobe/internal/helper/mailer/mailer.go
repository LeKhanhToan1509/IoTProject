package mailer

import (
	"iot/internal/helper"
)

type EmailSender interface {
	BuildMessage(to string, data map[string]string) *helper.MailMessage
}

type RegisterEmail struct {
	From string
}

func (r *RegisterEmail) BuildMessage(to string, data map[string]string) *helper.MailMessage {
	return &helper.MailMessage{
		From:    r.From,
		To:      []string{to},
		Subject: "Welcome " + data["name"],
		Body:    "<h1>Xin chào " + data["name"] + "!</h1><p>Cảm ơn bạn đã đăng ký.</p>. <p>Chúng tôi hy vọng bạn sẽ thích ứng dụng của chúng tôi.</p> OTP của bạn là: <b>" + data["otp"] + "</b></p>",
		IsHTML:  true,
	}
}

type LoginOTPEmail struct {
	From string
}

func (l *LoginOTPEmail) BuildMessage(to string, data map[string]string) *helper.MailMessage {
	return &helper.MailMessage{
		From:    l.From,
		To:      []string{to},
		Subject: "Mã OTP đăng nhập của bạn",
		Body:    "<p>Mã OTP của bạn là: <b>" + data["otp"] + "</b></p>",
		IsHTML:  true,
	}
}

type WelcomeEmail struct {
	From string
}

func (w *WelcomeEmail) BuildMessage(to string, data map[string]string) *helper.MailMessage {
	return &helper.MailMessage{
		From:    w.From,
		To:      []string{to},
		Subject: "Chào mừng bạn đến với ứng dụng của chúng tôi!",
		Body:    "<h1>Xin chào " + data["name"] + "!</h1><p>Cảm ơn bạn đã đăng ký.</p>. <p>Chúng tôi hy vọng bạn sẽ thích ứng dụng của chúng tôi.</p>",
		IsHTML:  true,
	}
}
