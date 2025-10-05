import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../store/query";

export const RecipiesList = () => {
    const { isPending, error, data } = useQuery({
        queryKey: ['test'],
        queryFn: () =>
          fetch('http://localhost:3000/api/test').then((res) =>
            res.json(),
          ),
      }, queryClient)
    
      if (isPending) return 'Loading...'
    
      if (error) return 'An error has occurred: ' + error.message

    
  return <div>RecipiesList {JSON.stringify(data)}</div>;
};