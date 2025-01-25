/**
 * @jest-environment jsdom
 */

import Application from "./Application";

// try to create a new instance of Application() which should throw an error
test("Test App: instantiation", () => {
  expect(() => {
    const s = new Application();
  }).toThrow();
});

test("getToken ", () => {
  expect(Application.getAccessToken()).toBe(null);
});

const dummy_token = {
  refresh:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTczMjk4MDExOCwiaWF0IjoxNzMyODkzNzE4LCJqdGkiOiI5YjZiYzk2OTE4OGM0MTg4OWRjZWFiODhlZmZjOTIxNSIsInVzZXJfaWQiOjEsInVzZXJuYW1lIjoiTmljb2xhc1JlYSIsIm5pY2tuYW1lIjoiam9qbyIsImlzX2FkbWluIjpmYWxzZX0.-zcA49e7NR3cVYqPK_UeV2gaQHoEaM8O-2q68WYkwaQ",
  access:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMyODk0MDE4LCJpYXQiOjE3MzI4OTM3MTgsImp0aSI6Ijg1MmI3OWMyYjJlZTQwNDliMGM5ZDIzODc1M2ZjY2E3IiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJOaWNvbGFzUmVhIiwibmlja25hbWUiOiJqb2pvIiwiaXNfYWRtaW4iOmZhbHNlfQ.utzM131y37Xh-cDh1xnzoWc64YMdiUtZYPqS72FsPcU",
};

test("setToken /getToken ", () => {
  Application.setToken(dummy_token);
  expect(Application.getAccessToken()).toBe(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMyODk0MDE4LCJpYXQiOjE3MzI4OTM3MTgsImp0aSI6Ijg1MmI3OWMyYjJlZTQwNDliMGM5ZDIzODc1M2ZjY2E3IiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJOaWNvbGFzUmVhIiwibmlja25hbWUiOiJqb2pvIiwiaXNfYWRtaW4iOmZhbHNlfQ.utzM131y37Xh-cDh1xnzoWc64YMdiUtZYPqS72FsPcU"
  );
  expect(Application.getRefreshToken()).toBe(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTczMjk4MDExOCwiaWF0IjoxNzMyODkzNzE4LCJqdGkiOiI5YjZiYzk2OTE4OGM0MTg4OWRjZWFiODhlZmZjOTIxNSIsInVzZXJfaWQiOjEsInVzZXJuYW1lIjoiTmljb2xhc1JlYSIsIm5pY2tuYW1lIjoiam9qbyIsImlzX2FkbWluIjpmYWxzZX0.-zcA49e7NR3cVYqPK_UeV2gaQHoEaM8O-2q68WYkwaQ"
  );
});
