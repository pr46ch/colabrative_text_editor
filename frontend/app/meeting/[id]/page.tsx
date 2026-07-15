import { MeetingRoom } from "@/components/meeting/MeetingRoom";

type MeetingPageProps = {
  params: {
    id: string;
  };
};

export default function MeetingPage({ params }: MeetingPageProps) {
  return <MeetingRoom meetingId={params.id} />;
}
