import { useParams } from "react-router-dom";
import EntityDetailPage from "./EntityDetail";

export default function EntityDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Entity not found</h2>
          <p className="text-muted-foreground">
            The requested entity could not be found.
          </p>
        </div>
      </div>
    );
  }

  return <EntityDetailPage entityId={id} />;
}
