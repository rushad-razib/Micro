<?php

namespace Tests\Feature;

use App\Mail\ContactMessage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    public function test_contact_form_sends_mail(): void
    {
        Mail::fake();

        $response = $this->post('/contact', [
            'name' => 'Alex Visitor',
            'email' => 'alex@example.com',
            'message' => 'Hello from the contact form.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');

        Mail::assertSent(ContactMessage::class, function (ContactMessage $mail) {
            return $mail->name === 'Alex Visitor'
                && $mail->email === 'alex@example.com'
                && str_contains($mail->body, 'Hello from the contact form.');
        });
    }

    public function test_contact_form_is_rate_limited(): void
    {
        Mail::fake();
        RateLimiter::clear('contact:127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $this->post('/contact', [
                'name' => 'Alex',
                'email' => 'alex@example.com',
                'message' => "Message number {$i}",
            ])->assertSessionHasNoErrors();
        }

        $this->post('/contact', [
            'name' => 'Alex',
            'email' => 'alex@example.com',
            'message' => 'One too many',
        ])->assertSessionHasErrors('email');
    }

    public function test_there_is_no_image_upload_route(): void
    {
        $upload = $this->post('/upload');
        $this->assertContains($upload->status(), [404, 405]);

        $this->post('/compress-image')->assertMethodNotAllowed();
        $this->post('/resize-image')->assertMethodNotAllowed();
    }
}
