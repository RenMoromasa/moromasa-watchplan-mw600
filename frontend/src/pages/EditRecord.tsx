import { Link, useParams } from "react-router-dom";

function EditRecord() {
  const { id } = useParams();

  return (
    <div className="container">
      <h1>Edit Record</h1>

      <p>Editing record ID: {id}</p>

      <p>
        Next Assignment.
      </p>

      <Link to="/">Back to Dashboard</Link>
    </div>
  );
}

export default EditRecord;