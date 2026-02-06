import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="max-w-5xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Weavy Clone</h1>
          <p className="text-lg text-gray-600">
            Your workflow automation platform is ready!
          </p>
        </div>
      </main>
    </div>
  );
}