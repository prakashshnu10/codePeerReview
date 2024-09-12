
def majority_element(v):
    # size of the given array
    n = len(v);
        
    for i in range(n):
        # selected element is v[i]
        cnt = 0
        for j in range(n):
            # counting the frequency of v[i]
            if v[j] == v[i]:
                cnt += 1
            
            # check if frequency is greater than n/2
            if cnt > (n / 2):
                return v[i]
        
    return -1
