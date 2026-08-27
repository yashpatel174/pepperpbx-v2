import useDomainStore from '../store/domain'

/** Centralized access to the active domain/tenant — don't thread `domainId` through props. */
const useCurrentDomain = () => useDomainStore(state => state.currentDomain)

export default useCurrentDomain
