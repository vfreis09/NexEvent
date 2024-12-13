import Header from "../../components/Header/Header";
import EventForm from "../../components/EventForm/EventForm";

function EditEvent() {
  return (
    <>
      <Header />
      <EventForm isEditing={true} />
    </>
  );
}

export default EditEvent;