import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface PageScaffoldProps {
  title: string;
  description: string;
  phase?: number;
  children?: ReactNode;
}

export default function PageScaffold({ title, description, phase, children }: PageScaffoldProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {phase && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              Coming in Phase {phase}
            </CardTitle>
            <CardDescription>
              This feature is planned for Phase {phase} of the OnlySigned platform development.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {children}
    </div>
  );
}
