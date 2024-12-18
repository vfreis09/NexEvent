import Header from "../../components/Header/Header";
import EventForm from "../../components/EventForm/EventForm";

function CreateEvent() {
  return (
    <>
      <Header />
      <EventForm isEditing={false} />
    </>
  );
}

export default CreateEvent;
