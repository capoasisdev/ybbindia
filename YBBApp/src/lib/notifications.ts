import { LocalNotifications } from "@capacitor/local-notifications";

export const initNotifications = async () => {
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== "granted") {
      await LocalNotifications.requestPermissions();
    }
  } catch (err) {
    console.warn("Notification permission check fallback:", err);
  }
};

export const sendPushNotification = async (
  title: string,
  body: string,
  id: number = Date.now() % 100000
) => {
  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== "granted") return false;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + 500) }, // 500ms immediate trigger
          sound: undefined,
          actionTypeId: "",
          extra: null,
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn("Could not schedule local push notification:", err);
    return false;
  }
};
