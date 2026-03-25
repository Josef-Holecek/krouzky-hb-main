'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Obnovu hesla se nepodařilo odeslat.');
      }

      const message = 'Pokud účet existuje, poslali jsme email pro obnovu hesla. Zkontrolujte doručenou poštu, spam i hromadné složky.';
      toast.success(message);
      setSuccessMessage(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Došlo k chybě při odesílání emailu.';
      toast.error(message);
    }

    setIsSubmitting(false);
  };

  return (
    <section className="py-16 min-h-[70vh] flex items-center">
      <div className="container max-w-md">
        <Card className="shadow-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-brand-navy">Obnova hesla</CardTitle>
            <CardDescription>
              Zadejte email, na který vám pošleme odkaz pro nastavení nového hesla.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="vas@email.cz"
                    className="pl-10"
                    maxLength={120}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Odesílání...' : 'Poslat odkaz pro reset'}
                <Send className="ml-2 h-4 w-4" />
              </Button>

              {successMessage && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  {successMessage}
                </p>
              )}

              <div className="text-center">
                <Link
                  href="/prihlaseni"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Zpět na přihlášení
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
