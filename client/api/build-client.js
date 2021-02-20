import axios from 'axios';

export default ({ req }) => {
  if (typeof window === 'undefined') {
    // on the server
    return axios.create({
      // baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',
      baseURL: 'http://www.ticketing-app-keith.xyz',
      headers: req.headers
    })
  } else {
    // on the brower
    return axios.create({
      baseURL: '/'
    });
  }
}