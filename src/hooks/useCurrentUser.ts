import useAuthStore from '../store/auth'

const useCurrentUser = () => useAuthStore(state => state.user)

export default useCurrentUser
