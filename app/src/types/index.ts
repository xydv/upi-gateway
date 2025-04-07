export type Notification = {
  time: string;
  app: string;
  title: string;
  titleBig: string;
  text: string;
  subText: string;
  summaryText: string;
  bigText: string;
  audioContentsURI: string;
  imageBackgroundURI: string;
  extraInfoText: string;
  groupedMessages: [
    {
      title: string;
      text: string;
    },
  ];
  icon: string;
  image: string;
};

export type Request = {
  status: number;
  id: string;
  amount: string | null;
  note: string;
};
