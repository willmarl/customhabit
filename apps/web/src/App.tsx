import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function App() {
  const [count, setCount] = useState(0);
  const [foos, setFoos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchFoos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/foos");
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setFoos([]);
      } else {
        setFoos(data.foos);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const createFile = async () => {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/create-file", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        await fetchFoos();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  const deleteFile = async () => {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/delete-file", { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        await fetchFoos();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Button className="w-full" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </Button>

        <Button className="w-full" onClick={fetchFoos} disabled={loading}>
          {loading ? "Loading..." : "Fetch Foos"}
        </Button>

        <Button className="w-full" onClick={createFile}>
          Create foo.txt
        </Button>

        <Button className="w-full" variant="destructive" onClick={deleteFile}>
          Delete foo.txt
        </Button>

        {error && <p className="text-destructive">{error}</p>}
        {message && <p className="text-green-600">{message}</p>}
        {foos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Foos ({foos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside">
                {foos.map((foo) => (
                  <li key={foo}>{foo}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
